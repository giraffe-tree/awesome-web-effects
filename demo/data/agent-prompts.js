const prompts = Object.freeze({
  en: 'Review the current project using https://giraffe-tree.github.io/awesome-web-effects/ as read-only inspiration. Pick one effect suited to the product and stack. Inspect its verified demo and minimal code; define 2–3 observable acceptance criteria, then adapt it with original assets, preserving responsive, keyboard, pointer, touch, prefers-reduced-motion, performance, and cleanup. Run tests and desktop/mobile browser checks. Report the effect URL, changed files, evidence per criterion, and remaining risks.',
  'zh-Hans': '审查当前项目，把 Awesome Web Effects（https://giraffe-tree.github.io/awesome-web-effects/?lang=zh-Hans）作为只读参考。选择一个符合产品和技术栈的效果，查看已验证 Demo 与最小代码，并定义 2–3 条可观察验收标准。用原创素材适配，保留响应式、键盘、指针、触控、prefers-reduced-motion、性能与资源清理。运行现有测试及桌面/移动浏览器检查，报告效果直达地址、改动文件、逐条证据和遗留风险。',
});

export const canonicalAgentPromptLocale = 'en';

export function getOneLineAgentPrompt(locale = canonicalAgentPromptLocale) {
  return prompts[locale] || prompts[canonicalAgentPromptLocale];
}

export const oneLineAgentPrompts = prompts;
