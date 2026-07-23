#!/usr/bin/env swift

import AppKit
import AVFoundation
import Foundation
import ImageIO
import Photos

enum LivePhotoToolError: LocalizedError {
    case usage(String)
    case invalidImage(URL)
    case imageDestination(URL)
    case imageWrite(URL)
    case existingOutput(URL)
    case mismatchedIdentifier(photo: String?, video: String?)
    case livePhotoValidation(String)

    var errorDescription: String? {
        switch self {
        case .usage(let message):
            return message
        case .invalidImage(let url):
            return "Unable to read image metadata from \(url.path)"
        case .imageDestination(let url):
            return "Unable to create image destination at \(url.path)"
        case .imageWrite(let url):
            return "Unable to finalize image at \(url.path)"
        case .existingOutput(let url):
            return "Output already exists: \(url.path)"
        case .mismatchedIdentifier(let photo, let video):
            return "Live Photo identifiers do not match (photo=\(photo ?? "nil"), video=\(video ?? "nil"))"
        case .livePhotoValidation(let message):
            return "Photos rejected the Live Photo pair: \(message)"
        }
    }
}

func usage() -> String {
    """
    Usage:
      xcrun swift scripts/live-photo-tool.swift package PHOTO MOV OUTPUT.pvt ASSET_ID
      xcrun swift scripts/live-photo-tool.swift validate PHOTO MOV
    """
}

func writePhoto(_ inputURL: URL, to outputURL: URL, assetIdentifier: String) throws {
    guard
        let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
        let imageType = CGImageSourceGetType(source),
        var properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any]
    else {
        throw LivePhotoToolError.invalidImage(inputURL)
    }

    var makerApple = properties[kCGImagePropertyMakerAppleDictionary] as? [CFString: Any] ?? [:]
    makerApple["17" as CFString] = assetIdentifier
    properties[kCGImagePropertyMakerAppleDictionary] = makerApple

    guard let destination = CGImageDestinationCreateWithURL(outputURL as CFURL, imageType, 1, nil) else {
        throw LivePhotoToolError.imageDestination(outputURL)
    }
    CGImageDestinationAddImageFromSource(destination, source, 0, properties as CFDictionary)
    guard CGImageDestinationFinalize(destination) else {
        throw LivePhotoToolError.imageWrite(outputURL)
    }
}

func writeMovie(_ inputURL: URL, to outputURL: URL, assetIdentifier: String) throws {
    try FileManager.default.copyItem(at: inputURL, to: outputURL)
    let movie = AVMutableMovie(url: outputURL, options: nil)
    let contentIdentifier = AVMutableMetadataItem()
    contentIdentifier.identifier = .quickTimeMetadataContentIdentifier
    contentIdentifier.value = assetIdentifier as NSString
    movie.metadata = movie.metadata.filter {
        $0.identifier != .quickTimeMetadataContentIdentifier
    } + [contentIdentifier]
    try movie.writeHeader(to: outputURL, fileType: .mov, options: [])
}

func writePackageMetadata(to outputURL: URL) throws {
    let metadata: [String: Any] = [
        "PFVideoComplementMetadataVersionKey": "1"
    ]
    let data = try PropertyListSerialization.data(
        fromPropertyList: metadata,
        format: .xml,
        options: 0
    )
    try data.write(to: outputURL, options: .atomic)
}

func package(photoURL: URL, movieURL: URL, outputURL: URL, assetIdentifier: String) throws {
    if FileManager.default.fileExists(atPath: outputURL.path) {
        throw LivePhotoToolError.existingOutput(outputURL)
    }
    try FileManager.default.createDirectory(
        at: outputURL,
        withIntermediateDirectories: true
    )

    let packagedPhoto = outputURL.appendingPathComponent(photoURL.lastPathComponent)
    let packagedMovie = outputURL.appendingPathComponent(movieURL.lastPathComponent)
    do {
        try writePhoto(photoURL, to: packagedPhoto, assetIdentifier: assetIdentifier)
        try writeMovie(movieURL, to: packagedMovie, assetIdentifier: assetIdentifier)
        try writePackageMetadata(to: outputURL.appendingPathComponent("metadata.plist"))
    } catch {
        try? FileManager.default.removeItem(at: outputURL)
        throw error
    }
    print("LIVE_PHOTO_PACKAGED assetIdentifier=\(assetIdentifier) output=\(outputURL.path)")
}

func photoIdentifier(at url: URL) -> String? {
    guard
        let source = CGImageSourceCreateWithURL(url as CFURL, nil),
        let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
        let makerApple = properties[kCGImagePropertyMakerAppleDictionary] as? [CFString: Any]
    else {
        return nil
    }
    return makerApple["17" as CFString] as? String
}

func photoPixelSize(at url: URL) throws -> CGSize {
    guard
        let source = CGImageSourceCreateWithURL(url as CFURL, nil),
        let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
        let width = properties[kCGImagePropertyPixelWidth] as? NSNumber,
        let height = properties[kCGImagePropertyPixelHeight] as? NSNumber
    else {
        throw LivePhotoToolError.invalidImage(url)
    }
    return CGSize(width: width.doubleValue, height: height.doubleValue)
}

func movieIdentifier(at url: URL) async throws -> String? {
    let movie = AVMutableMovie(url: url, options: nil)
    let metadata = try await movie.load(.metadata)
    guard let identifierItem = metadata.first(where: {
        $0.identifier == .quickTimeMetadataContentIdentifier
    }) else {
        return nil
    }
    return try await identifierItem.load(.stringValue)
}

@MainActor
func validatedLivePhotoSize(
    photoURL: URL,
    movieURL: URL,
    targetSize: CGSize
) async throws -> CGSize {
    _ = NSApplication.shared
    return try await withCheckedThrowingContinuation { continuation in
        var didResume = false
        PHLivePhoto.request(
            withResourceFileURLs: [photoURL, movieURL],
            placeholderImage: nil,
            targetSize: targetSize,
            contentMode: .aspectFit
        ) { livePhoto, info in
            guard !didResume else {
                return
            }
            if let error = info[PHLivePhotoInfoErrorKey] as? Error {
                didResume = true
                continuation.resume(throwing: error)
                return
            }
            let isDegraded =
                (info[PHLivePhotoInfoIsDegradedKey] as? NSNumber)?.boolValue ?? false
            guard !isDegraded else {
                return
            }
            didResume = true
            if let livePhoto {
                continuation.resume(returning: livePhoto.size)
            } else {
                continuation.resume(
                    throwing: LivePhotoToolError.livePhotoValidation(
                        "validation completed without a PHLivePhoto"
                    )
                )
            }
        }
    }
}

func validate(photoURL: URL, movieURL: URL) async throws {
    let imageIdentifier = photoIdentifier(at: photoURL)
    let videoIdentifier = try await movieIdentifier(at: movieURL)
    let expectedSize = try photoPixelSize(at: photoURL)
    guard imageIdentifier != nil, imageIdentifier == videoIdentifier else {
        throw LivePhotoToolError.mismatchedIdentifier(
            photo: imageIdentifier,
            video: videoIdentifier
        )
    }

    let validatedSize = try await validatedLivePhotoSize(
        photoURL: photoURL,
        movieURL: movieURL,
        targetSize: expectedSize
    )
    guard validatedSize.width > 0, validatedSize.height > 0 else {
        throw LivePhotoToolError.livePhotoValidation(
            "Photos returned a zero-sized Live Photo"
        )
    }
    print(
        "LIVE_PHOTO_VALID assetIdentifier=\(imageIdentifier!) " +
        "width=\(Int(validatedSize.width)) height=\(Int(validatedSize.height))"
    )
}

do {
    let arguments = Array(CommandLine.arguments.dropFirst())
    guard let command = arguments.first else {
        throw LivePhotoToolError.usage(usage())
    }
    switch command {
    case "package":
        guard arguments.count == 5 else {
            throw LivePhotoToolError.usage(usage())
        }
        try package(
            photoURL: URL(fileURLWithPath: arguments[1]),
            movieURL: URL(fileURLWithPath: arguments[2]),
            outputURL: URL(fileURLWithPath: arguments[3]),
            assetIdentifier: arguments[4]
        )
    case "validate":
        guard arguments.count == 3 else {
            throw LivePhotoToolError.usage(usage())
        }
        try await validate(
            photoURL: URL(fileURLWithPath: arguments[1]),
            movieURL: URL(fileURLWithPath: arguments[2])
        )
    default:
        throw LivePhotoToolError.usage(usage())
    }
} catch {
    FileHandle.standardError.write(
        "live-photo-tool: \(error.localizedDescription)\n".data(using: .utf8)!
    )
    exit(1)
}
