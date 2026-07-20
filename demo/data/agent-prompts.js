const prompts = Object.freeze({
  en: 'Inspect the current project and use the complete Awesome Web Effects catalog (https://giraffe-tree.github.io/awesome-web-effects/; if the page is unreadable, inspect demo/data/effects.js and demo/preview-demos/ in the read-only GitHub repository at https://github.com/giraffe-tree/awesome-web-effects) strictly as a reference: choose the single effect that best fits the product goal, existing visual language, key user flow, and stack, adding a second only when it provides clear complementary and non-conflicting value; study each chosen entry\'s verified preview, runnable demo when available, minimal code, and dedicated Agent Prompt, then adapt and implement it directly in the current project using existing dependencies where practical and original assets, without copying source-site branding or proprietary code or modifying the reference repository, while preserving responsive behavior, keyboard, pointer, and touch accessibility, prefers-reduced-motion, performance, and resource cleanup; run the existing tests and an available browser check, fix any issues, and finish by reporting the selected effects, changed files, and verification results, and if neither reference can be accessed, do not invent an effect and report the blocker.',
  'zh-Hans': '审查当前项目，并把 Awesome Web Effects 完整目录（https://giraffe-tree.github.io/awesome-web-effects/?lang=zh-Hans；页面不可读时改查 GitHub 仓库 https://github.com/giraffe-tree/awesome-web-effects 的 demo/data/effects.js 与 demo/preview-demos/）作为只读参考：依据产品目标、现有视觉语言、关键用户流程和技术栈选择最匹配的一个效果，仅在第二个效果明确互补且不冲突时再加入；阅读所选条目的已验证预览、可运行 Demo（如有）、最小代码和专属 Agent Prompt，然后直接在当前项目中适配实现，优先复用现有依赖并使用原创资产，不复制来源网站的品牌或专有代码、不修改参考仓库，同时保证响应式、键盘、指针与触控可用、无障碍、prefers-reduced-motion、性能和资源清理，运行现有测试与可用的浏览器检查并修复问题，最后报告所选效果、改动文件和验证结果；若两个入口均不可访问，不要臆造效果，直接说明阻塞。',
});

export const canonicalAgentPromptLocale = 'en';

export function getOneLineAgentPrompt(locale = canonicalAgentPromptLocale) {
  return prompts[locale] || prompts[canonicalAgentPromptLocale];
}

export const oneLineAgentPrompts = prompts;
