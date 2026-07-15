# GitHub Pages 部署

[English](./GITHUB_PAGES.md)

## 兼容性

当前 demo 兼容 GitHub Pages。GitHub Pages 可发布静态 HTML、CSS 和 JavaScript；本仓库的 `demo/` 不依赖服务端运行时，也不需要构建步骤。JavaScript 数据文件与 GIF 都使用相对 URL，因此部署到项目站点路径后仍可正常加载。

预期线上地址：<https://giraffe-tree.github.io/awesome-interaction/>

## 首次启用

1. 在 GitHub 打开本仓库的 **Settings → Pages**。
2. 在 **Build and deployment** 下，将 **Source** 设为 **GitHub Actions**。
3. 推送到 `main`；也可以打开 **Actions → Deploy demo to GitHub Pages → Run workflow** 手动发布。
4. 打开工作流 `github-pages` 部署环境中显示的 URL。预期地址见上文。

工作流会把 `demo/` 直接发布为站点根目录，不复制仓库根目录、不运行 Jekyll，也不创建 `gh-pages` 分支。

## 验证

推送前，应通过本地 HTTP 服务访问同一目录，不要用 `file://` 直接打开 HTML：

```sh
python3 -m http.server 8000 --directory demo
```

然后打开 <http://localhost:8000/>，检查项目卡片、筛选功能、脚本和 GIF 预览是否正常。部署完成后，在生产地址重复检查，并通过浏览器控制台和网络面板确认没有文件加载失败。

## 使用限制

- GitHub Pages 只提供静态托管：不能运行服务端代码，也不能提供私密 API Key 或运行时环境变量。如需调用外部 API，应另设后端，且不得把密钥写入浏览器代码。
- 项目站点位于 `/<仓库名>/` 下。新增内部资源时应继续使用相对路径（当前即如此），或者为根相对 URL 补上仓库基础路径。
- Pages 站点会公开在互联网上；如果账户套餐允许从私有仓库发布，生成的站点仍然是公开的。
- GitHub 官方限制包括：发布站点最大 1 GB、每月 100 GB 软带宽上限，以及 10 分钟部署超时。持续压缩 GIF 可减少仓库体积、部署时间和流量。

## 官方参考

- [GitHub Pages 是什么？](https://docs.github.com/zh/pages/getting-started-with-github-pages/what-is-github-pages)
- [配置发布源](https://docs.github.com/zh/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [通过自定义工作流使用 GitHub Pages](https://docs.github.com/zh/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pages 限制](https://docs.github.com/zh/pages/getting-started-with-github-pages/github-pages-limits)
