# 仓库约定

- Git 远端：`git@github.com:giraffe-tree/awesome-web-effects.git`。用户要求推送且 SSH 失败时，改用 `git push https://github.com/giraffe-tree/awesome-web-effects.git main:main`。
- `demo/data/effects.js` 和 `demo/data/additional-effects.js` 是特效目录数据源；`demo/data/company-observations.js` 只记录官网观察关系。
- 特效是主实体。“推荐实现”和“观察到该效果的 AI 官网”是不同关系，不得混为实现归属；每种特效最多关联 3 家有证据的公司，无法验证时不添加。
- GIF 必须对应特效行为和相关代码，禁止回退到随机通用模板。批量重生成前先检查语义场景规则。
- `README.md` 与 `README.zh-CN.md` 由 `scripts/build-docs.mjs` 生成，不要手改目录表格。

提交前运行：

```bash
node scripts/build-docs.mjs
node scripts/generate-gif-previews.mjs --audit
node scripts/validate.mjs
git diff --check
```
