#!/usr/bin/env python3
"""Build the compact browser asset used by the GNM Head Explorer demo.

The script downloads the Apache-2.0 GNM Head v3 model and its semantic
decoders from google/GNM, verifies their checksums, then extracts only the
geometry and deterministic morph targets needed by the browser demo.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import tempfile
import urllib.request

import h5py
import numpy as np


SOURCES = {
    "model": {
        "url": "https://raw.githubusercontent.com/google/GNM/main/gnm/shape/data/versions/v3_0/gnm_head.npz",
        "sha256": "9ddfe70b2d5a14716f2a1580ddf7eeaddf6f83cbd34169cebc4add76bf659261",
        "filename": "gnm_head.npz",
    },
    "expression_decoder": {
        "url": "https://raw.githubusercontent.com/google/GNM/main/gnm/shape/data/semantic_sampler/expression_decoder_model.h5",
        "sha256": "5eba165f8a414f73b24be96963d0a17e708c0856739ed85a19031f318dfb51e6",
        "filename": "expression_decoder_model.h5",
    },
    "identity_decoder": {
        "url": "https://raw.githubusercontent.com/google/GNM/main/gnm/shape/data/semantic_sampler/identity_decoder_model.h5",
        "sha256": "1f069bf4975620e25a053772719a35678c9cfe6121e58bc4276a3515b53ac142",
        "filename": "identity_decoder_model.h5",
    },
}

EXPRESSION_LAYERS = ("dense_13", "dense_14", "dense_15", "dense_16", "dense_17")
IDENTITY_LAYERS = ("dense_4", "dense_5", "dense_6", "dense_7", "dense_8")
EXPRESSIONS = (
    ("happy", 5, 20260726),
    ("surprise", 0, 20260721),
    ("wink_left", 13, 20260734),
    ("pucker", 12, 20260733),
)
IDENTITIES = (
    ("identity_a", 1103),
    ("identity_b", 2207),
    ("identity_c", 3301),
)
COMPONENT_COLORS = (
    (0.78, 0.68, 0.58),
    (0.43, 0.70, 0.74),
    (0.43, 0.70, 0.74),
    (0.92, 0.90, 0.77),
    (0.86, 0.82, 0.69),
    (0.83, 0.33, 0.33),
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def fetch_source(spec: dict[str, str], cache_dir: Path) -> Path:
    destination = cache_dir / spec["filename"]
    if not destination.exists() or sha256(destination) != spec["sha256"]:
        print(f"Downloading {spec['url']}")
        urllib.request.urlretrieve(spec["url"], destination)
    actual = sha256(destination)
    if actual != spec["sha256"]:
        raise RuntimeError(
            f"Checksum mismatch for {destination.name}: expected {spec['sha256']}, got {actual}"
        )
    return destination


def load_dense_layers(path: Path, names: tuple[str, ...]) -> list[tuple[np.ndarray, np.ndarray]]:
    layers = []
    with h5py.File(path, "r") as model:
        for name in names:
            root = f"model_weights/{name}/{name}"
            layers.append(
                (
                    np.asarray(model[f"{root}/kernel:0"], dtype=np.float32),
                    np.asarray(model[f"{root}/bias:0"], dtype=np.float32),
                )
            )
    return layers


def decode(layers: list[tuple[np.ndarray, np.ndarray]], latent: np.ndarray, label: np.ndarray) -> np.ndarray:
    value = np.concatenate((latent, label)).astype(np.float32)
    for index, (kernel, bias) in enumerate(layers):
        value = value @ kernel + bias
        if index < len(layers) - 1:
            value = np.maximum(value, 0)
    return value.astype(np.float32)


def compute_normals(vertices: np.ndarray, triangles: np.ndarray) -> np.ndarray:
    normals = np.zeros_like(vertices, dtype=np.float32)
    corners = vertices[triangles]
    face_normals = np.cross(corners[:, 1] - corners[:, 0], corners[:, 2] - corners[:, 0])
    for corner in range(3):
        np.add.at(normals, triangles[:, corner], face_normals)
    lengths = np.linalg.norm(normals, axis=1, keepdims=True)
    return (normals / np.maximum(lengths, 1e-8)).astype(np.float32)


def axis_angle_matrices(rotations: np.ndarray) -> np.ndarray:
    """Rodrigues rotation matrices matching GNM's NumPy implementation."""
    matrices = []
    for rotation in rotations:
        angle = float(np.linalg.norm(rotation))
        if angle < 1e-8:
            matrices.append(np.eye(3, dtype=np.float32))
            continue
        axis = rotation / angle
        x, y, z = axis
        skew = np.array(((0, -z, y), (z, 0, -x), (-y, x, 0)), dtype=np.float32)
        matrix = np.eye(3, dtype=np.float32)
        matrix += np.sin(angle) * skew + (1 - np.cos(angle)) * (skew @ skew)
        matrices.append(matrix)
    return np.stack(matrices).astype(np.float32)


def joint_transforms_world(
    joints: np.ndarray,
    rotations: np.ndarray,
    parents: np.ndarray,
) -> np.ndarray:
    rotation_matrices = axis_angle_matrices(rotations)
    local_transforms = []
    for index, rotation in enumerate(rotation_matrices):
        transform = np.eye(4, dtype=np.float32)
        transform[:3, :3] = rotation
        transform[:3, 3] = (
            joints[index] if index == 0 else joints[index] - joints[parents[index]]
        )
        local_transforms.append(transform)
    world_transforms = [local_transforms[0]]
    for index in range(1, len(local_transforms)):
        world_transforms.append(world_transforms[parents[index]] @ local_transforms[index])
    return np.stack(world_transforms)


def pose_vertices(
    bind_vertices: np.ndarray,
    joints: np.ndarray,
    rotations: np.ndarray,
    parents: np.ndarray,
    skinning_weights: np.ndarray,
    pose_correctives_regressor: np.ndarray,
) -> tuple[np.ndarray, np.ndarray]:
    rotation_matrices = axis_angle_matrices(rotations)
    pose_features = (rotation_matrices - np.eye(3, dtype=np.float32)).reshape(-1)
    pose_correctives = (pose_features @ pose_correctives_regressor).reshape(-1, 3)
    corrected_vertices = bind_vertices + pose_correctives

    world_transforms = joint_transforms_world(joints, rotations, parents)
    rotated_joint_positions = np.einsum(
        "jik,jk->ji", world_transforms[:, :3, :3], joints
    )
    offsets = np.zeros_like(world_transforms)
    offsets[:, :3, 3] = rotated_joint_positions
    skinning_transforms = world_transforms - offsets

    homogeneous = np.concatenate(
        (corrected_vertices, np.ones((corrected_vertices.shape[0], 1), dtype=np.float32)),
        axis=1,
    )
    posed = np.einsum(
        "jv,jmn,vn->vm", skinning_weights, skinning_transforms, homogeneous
    )[:, :3]
    posed_joints = world_transforms[:, :3, 3]
    return posed.astype(np.float32), posed_joints.astype(np.float32)


def component_ids(model: np.lib.npyio.NpzFile) -> tuple[list[str], np.ndarray]:
    group_names = model["vertex_group_names"].tolist()
    component_names = model["mesh_component_names"].tolist()
    rows = [group_names.index(name) for name in component_names]
    weights = model["vertex_groups"][rows]
    return component_names, np.argmax(weights, axis=0).astype(np.uint8)


def sorted_component_triangles(
    triangles: np.ndarray, vertex_components: np.ndarray, component_names: list[str]
) -> tuple[np.ndarray, dict[str, dict[str, int]]]:
    triangle_components = vertex_components[triangles]
    if np.any(triangle_components != triangle_components[:, :1]):
        raise RuntimeError("GNM mesh unexpectedly contains cross-component triangles")
    labels = triangle_components[:, 0]
    ordered = []
    ranges: dict[str, dict[str, int]] = {}
    cursor = 0
    for component_index, name in enumerate(component_names):
        indices = triangles[labels == component_index].reshape(-1).astype(np.uint16)
        ranges[name] = {"indexOffset": cursor, "indexCount": int(indices.size)}
        cursor += int(indices.size)
        ordered.append(indices)
    return np.concatenate(ordered), ranges


def unique_edges(quads: np.ndarray) -> np.ndarray:
    edges = np.concatenate(
        (
            quads[:, (0, 1)],
            quads[:, (1, 2)],
            quads[:, (2, 3)],
            quads[:, (3, 0)],
        ),
        axis=0,
    )
    edges = np.sort(edges, axis=1)
    return np.unique(edges, axis=0).astype(np.uint16).reshape(-1)


def add_array(
    payload: bytearray,
    manifest: dict[str, object],
    name: str,
    array: np.ndarray,
) -> None:
    while len(payload) % 4:
        payload.append(0)
    contiguous = np.ascontiguousarray(array)
    offset = len(payload)
    raw = contiguous.tobytes(order="C")
    payload.extend(raw)
    manifest[name] = {
        "byteOffset": offset,
        "byteLength": len(raw),
        "length": int(contiguous.size),
        "shape": list(contiguous.shape),
        "dtype": str(contiguous.dtype),
    }


def build(output_dir: Path, cache_dir: Path) -> None:
    source_paths = {name: fetch_source(spec, cache_dir) for name, spec in SOURCES.items()}
    expression_layers = load_dense_layers(source_paths["expression_decoder"], EXPRESSION_LAYERS)
    identity_layers = load_dense_layers(source_paths["identity_decoder"], IDENTITY_LAYERS)

    with np.load(source_paths["model"], allow_pickle=False) as model:
        template = np.asarray(model["template_vertex_positions"], dtype=np.float32)
        vertex_identity_basis = np.asarray(model["vertex_identity_basis"], dtype=np.float32)
        expression_basis = np.asarray(model["expression_basis"], dtype=np.float32)
        triangles = np.asarray(model["triangles"], dtype=np.int32)
        quads = np.asarray(model["quads"], dtype=np.int32)

        bounds_min = template.min(axis=0)
        bounds_max = template.max(axis=0)
        center = (bounds_min + bounds_max) * 0.5
        scale = np.float32(1.72 / np.max(bounds_max - bounds_min))
        normalized_template = ((template - center) * scale).astype(np.float32)

        names, part_ids = component_ids(model)
        ordered_indices, ranges = sorted_component_triangles(triangles, part_ids, names)
        edges = unique_edges(quads)
        normals = compute_normals(normalized_template, triangles)

        balanced_identity_condition = np.array(
            [0.5, 0.5, 0.25, 0.25, 0.25, 0.25], dtype=np.float32
        )
        identity_coefficients = []
        identity_deltas = []
        for _, seed in IDENTITIES:
            latent = np.random.default_rng(seed).normal(size=64).astype(np.float32)
            coefficients = decode(identity_layers, latent, balanced_identity_condition)
            identity_coefficients.append(coefficients)
            delta = np.tensordot(coefficients, vertex_identity_basis, axes=(0, 0)) * scale
            identity_deltas.append(delta.astype(np.float32))

        expression_coefficients = []
        expression_deltas = []
        for _, label_index, seed in EXPRESSIONS:
            latent = np.random.default_rng(seed).normal(size=64).astype(np.float32)
            label = np.zeros(20, dtype=np.float32)
            label[label_index] = 1
            coefficients = decode(expression_layers, latent, label)
            expression_coefficients.append(coefficients)
            delta = np.tensordot(coefficients, expression_basis, axes=(0, 0)) * scale
            expression_deltas.append(delta.astype(np.float32))

        principle_identity_index = 1
        principle_expression_weights = np.array([0.3, 0.45, 0.0, 0.0], dtype=np.float32)
        principle_identity = identity_coefficients[principle_identity_index]
        principle_expression = np.einsum(
            "i,ij->j", principle_expression_weights, np.stack(expression_coefficients)
        )
        principle_bind_vertices = (
            template
            + np.tensordot(principle_identity, vertex_identity_basis, axes=(0, 0))
            + np.tensordot(principle_expression, expression_basis, axes=(0, 0))
        )
        principle_bind_joints = (
            np.asarray(model["template_joint_positions"], dtype=np.float32)
            + np.tensordot(
                principle_identity,
                np.asarray(model["joint_identity_basis"], dtype=np.float32),
                axes=(0, 0),
            )
        )
        principle_rotations = np.array(
            ((0, 0, 0), (0, 0.32, 0), (0, -0.16, 0), (0, -0.16, 0)),
            dtype=np.float32,
        )
        joint_parents = np.asarray(model["joint_parent_indices"], dtype=np.int32)
        principle_posed_vertices, principle_posed_joints = pose_vertices(
            principle_bind_vertices,
            principle_bind_joints,
            principle_rotations,
            joint_parents,
            np.asarray(model["skinning_weights"], dtype=np.float32),
            np.asarray(model["pose_correctives_regressor"], dtype=np.float32),
        )
        principle_bind_normalized = ((principle_bind_vertices - center) * scale).astype(
            np.float32
        )
        principle_pose_delta = (
            (principle_posed_vertices - center) * scale - principle_bind_normalized
        ).astype(np.float32)
        principle_bind_joints_normalized = (
            (principle_bind_joints - center) * scale
        ).astype(np.float32)
        principle_posed_joints_normalized = (
            (principle_posed_joints - center) * scale
        ).astype(np.float32)

        colors = np.asarray([COMPONENT_COLORS[index] for index in part_ids], dtype=np.float32)

        arrays: dict[str, object] = {}
        payload = bytearray()
        add_array(payload, arrays, "templatePositions", normalized_template)
        add_array(payload, arrays, "templateNormals", normals)
        add_array(payload, arrays, "componentColors", colors)
        add_array(payload, arrays, "componentIds", part_ids)
        add_array(payload, arrays, "triangleIndices", ordered_indices)
        add_array(payload, arrays, "edgeIndices", edges)
        add_array(payload, arrays, "identityDeltas", np.stack(identity_deltas))
        add_array(payload, arrays, "expressionDeltas", np.stack(expression_deltas))
        add_array(payload, arrays, "principlePoseDelta", principle_pose_delta)
        add_array(payload, arrays, "principleBindJoints", principle_bind_joints_normalized)
        add_array(payload, arrays, "principlePosedJoints", principle_posed_joints_normalized)

        output_dir.mkdir(parents=True, exist_ok=True)
        binary_path = output_dir / "gnm-head-v3-demo.bin"
        binary_path.write_bytes(payload)
        binary_hash = sha256(binary_path)

        manifest = {
            "format": "gnm-head-explorer-v1",
            "model": "Google GNM Head",
            "version": str(model["version"].item()),
            "variant": str(model["variant"].item()),
            "license": "Apache-2.0",
            "upstream": "https://github.com/google/GNM",
            "binary": binary_path.name,
            "binaryByteLength": len(payload),
            "binarySha256": binary_hash,
            "vertexCount": int(template.shape[0]),
            "triangleCount": int(triangles.shape[0]),
            "quadCount": int(quads.shape[0]),
            "identityDimension": int(vertex_identity_basis.shape[0]),
            "expressionDimension": int(expression_basis.shape[0]),
            "componentNames": names,
            "componentRanges": ranges,
            "identityMorphNames": [name for name, _ in IDENTITIES],
            "expressionMorphNames": [name for name, _, _ in EXPRESSIONS],
            "jointNames": model["joint_names"].tolist(),
            "jointParentIndices": joint_parents.tolist(),
            "principlePoseBase": {
                "identityIndex": principle_identity_index,
                "identityStrength": 1.0,
                "expressionWeights": principle_expression_weights.tolist(),
                "rotations": principle_rotations.tolist(),
            },
            "normalization": {"center": center.tolist(), "scale": float(scale)},
            "sourceFiles": {
                name: {"url": spec["url"], "sha256": spec["sha256"]}
                for name, spec in SOURCES.items()
            },
            "arrays": arrays,
        }
        (output_dir / "gnm-head-v3-demo.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        print(
            f"Wrote {binary_path} ({len(payload):,} bytes, sha256 {binary_hash})\n"
            f"Wrote {output_dir / 'gnm-head-v3-demo.json'}"
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "assets",
    )
    parser.add_argument("--cache-dir", type=Path)
    args = parser.parse_args()
    if args.cache_dir:
        args.cache_dir.mkdir(parents=True, exist_ok=True)
        build(args.output_dir, args.cache_dir)
    else:
        with tempfile.TemporaryDirectory(prefix="gnm-head-explorer-") as temporary:
            build(args.output_dir, Path(temporary))


if __name__ == "__main__":
    main()
