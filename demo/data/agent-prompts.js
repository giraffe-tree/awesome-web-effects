const prompts = Object.freeze({
  en: 'Review the current project and use the Awesome Web Effects catalog (https://giraffe-tree.github.io/awesome-web-effects/) as read-only inspiration. Choose one effect that fits the product and existing stack, then adapt its verified demo and minimal code with original assets. Preserve responsive, keyboard, pointer, touch, prefers-reduced-motion, performance, and cleanup behavior. Run the existing tests and a browser check, then report the selected effect and changed files.',
  'zh-Hans': '审查当前项目，把 Awesome Web Effects 目录（https://giraffe-tree.github.io/awesome-web-effects/?lang=zh-Hans）作为只读参考。选择一个符合产品与现有技术栈的效果，依据已验证 Demo 和最小代码，用原创素材完成适配。保留响应式、键盘、指针、触控、prefers-reduced-motion、性能与资源清理；运行现有测试和浏览器检查，最后说明所选效果与改动文件。',
});

export const canonicalAgentPromptLocale = 'en';

export function getOneLineAgentPrompt(locale = canonicalAgentPromptLocale) {
  return prompts[locale] || prompts[canonicalAgentPromptLocale];
}

export const oneLineAgentPrompts = prompts;
