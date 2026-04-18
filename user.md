# Fuwari 写作与维护速查表

这份文档记录当前站点支持的特殊 Markdown 语法、自定义组件，以及本地常用维护脚本。它适合在写文章、排版和提交文章时快速查阅。

---

## 1. 文章 Frontmatter

文章通常放在 `src/content/posts/` 下，文件扩展名可以是 `.md` 或 `.mdx`。

常用 frontmatter 示例：

```yaml
---
title: 文章标题
published: 2026-04-18
description: 简短摘要
image: ''
tags:
  - 旅行
category: 旅行
draft: false
lang: ''
---
```

说明：

- `title` 是文章标题，也是自动提交脚本生成提交信息时会读取的字段。
- `description` 会用于文章摘要，也会被 `pnpm post-commit` 放进提交信息。
- `published` 使用 `YYYY-MM-DD` 格式。
- `draft: true` 表示草稿，`draft: false` 表示发布。
- `tags` 和 `category` 用于归档与筛选。

---

## 2. Spoiler 隐藏文字

站点支持防剧透隐藏文字。被隐藏内容默认以遮罩形式显示，鼠标悬停后显示正文。

语法：

```markdown
这是一段正常文字，||这是一段被隐藏的内容||，然后段落继续。
```

适合用途：

- 剧透内容
- 答案折叠
- 不希望第一眼看到的补充信息

---

## 3. Admonitions 提示框

推荐使用 `:::` 语法写提示框。

```markdown
:::tip
这是一个技巧提示。
:::

:::note
这是普通笔记。
:::

:::important
这是重要信息。
:::

:::warning
这是警告内容。
:::

:::caution
这是严重风险提示。
:::
```

支持的类型：

- `tip`
- `note`
- `important`
- `warning`
- `caution`

也支持 GitHub 风格的 admonition：

```markdown
> [!NOTE]
> 这是一段 GitHub 风格提示。
```

---

## 4. URL 预览卡片

外部链接可以写成 URL 卡片。页面渲染时会尝试抓取网站图标、标题和描述。

```markdown
::url{href="https://google.com"}
```

注意：

- 这个组件适合展示外部网页。
- 数据由前端动态获取，网络不可用时可能只显示加载或错误状态。

---

## 5. GitHub 仓库卡片

可以用 GitHub 卡片展示仓库信息。

```markdown
::github{repo="saicaca/fuwari"}
```

说明：

- `repo` 格式是 `owner/repo`。
- 组件会请求 GitHub API 显示仓库名称、简介、星标、分叉和许可证等信息。

---

## 6. 数学公式 KaTeX

站点通过 `remark-math` 和 `rehype-katex` 支持 LaTeX 数学公式。

行内公式：

```markdown
这是一个著名公式 $E = mc^2$。
```

块级公式：

```markdown
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

---

## 7. Expressive Code 代码块

代码块支持文件名、行高亮、增删标记和折叠区间。

带文件名：

````markdown
```javascript title="app.js"
console.log("Hello Fuwari!");
```
````

指定行高亮与增删：

````markdown
```python {1,3-5} ins={2} del={6}
# 第 1、3、4、5 行会高亮
# 第 2 行会显示新增效果
# 第 6 行会显示删除效果
```
````

折叠部分代码：

````markdown
```html collapse={2-8}
<ul>
  <li>隐藏的项目 1</li>
  <li>隐藏的项目 2</li>
  <!-- 中间内容默认折叠 -->
</ul>
```
````

---

## 8. Mermaid 图表

文章可以通过 `mermaid` 代码块绘制流程图、时序图、状态图等。

````markdown
```mermaid
flowchart TD
  A[开始] --> B{是否完成?}
  B -- 是 --> C[发布]
  B -- 否 --> D[继续修改]
  D --> B
```
````

适合用途：

- 技术流程说明
- 系统架构草图
- 时序图
- 决策流程

---

## 9. 外链自动处理

Markdown 里的外部链接会在构建时自动加上安全属性：

```html
target="_blank"
rel="noopener noreferrer"
```

普通写法即可：

```markdown
[OpenAI](https://openai.com)
[站内文章](/posts/example/)
```

说明：

- `http` 和 `https` 外部链接会在新标签页打开。
- 站内相对链接、锚点、`mailto:`、`tel:` 不会被当成外链处理。

---

## 10. 自动摘要与阅读时间

项目包含 `remarkExcerpt` 和 `remarkReadingTime`。

实际效果：

- 文章卡片可以使用 frontmatter 的 `description`。
- 如果没有合适的摘要，渲染逻辑可以使用 remark 生成的 excerpt。
- 阅读时间和字数会在文章卡片或文章页中展示。

---

## 11. 新建文章脚本

命令：

```powershell
pnpm new-post -- <filename>
```

行为：

- 如果没有传入文件名，会报错退出。
- 如果文件名没有 `.md` 或 `.mdx` 后缀，会自动补成 `.md`。
- 文件会创建到 `src/content/posts/` 下。
- 支持多级路径，例如 `pnpm new-post -- travel/hong-kong-note`。
- 如果目标文件已经存在，会报错退出，避免覆盖旧文章。
- 会自动写入基础 frontmatter。

生成的 frontmatter：

```yaml
---
title: <filename>
published: <当天日期>
description: ''
image: ''
tags: []
category: ''
draft: false 
lang: ''
---
```

---

## 12. 文章自动提交脚本

命令：

```powershell
pnpm post-commit
```

行为：

- 读取当前 Git 工作区状态。
- 只处理 `src/content/posts/` 下变动过的 `.md` 和 `.mdx` 文件。
- 支持 Git rename 记录，会取重命名后的新路径。
- 跳过已删除的文章文件。
- 读取文章 frontmatter 中的 `title` 和 `description`。
- 每篇文章单独 `git add`。
- 每篇文章单独 `git commit`，并用 pathspec 限定只提交当前文章文件。
- 所有文章提交完成后执行 `git push`。

提交信息格式：

```text
posts: publish "Title": description
posts: update "Title": description
```

注意：

- 这个脚本会真实提交并推送，不是 dry-run。
- 如果没有变动文章，会报错退出。
- 如果文章缺少 `title`，会跳过那篇文章。
- 它只适合处理文章文件；如果同时有代码、配置或 `.obsidian` 改动，建议单独提交。

---

## 13. 图片排版修复脚本

命令：

```powershell
pnpm fix-images
```

默认行为：

- 扫描 `src/content/posts/` 下所有 `.md` 和 `.mdx` 文件。
- 检查连续排列的 Markdown 图片行。
- 检查连续排列的单行 HTML `<img>` 图片行。
- 跳过代码块中的内容，避免误改示例代码。
- 默认只报告会修改哪些文件，不会写入。

示例：

```markdown
![](./a.jpg)
![](./b.jpg)
```

会整理为：

```markdown
![](./a.jpg)

![](./b.jpg)
```

真正写入文件：

```powershell
pnpm fix-images -- --write
```

---

## 14. 常用维护命令

```powershell
pnpm check
pnpm build
pnpm fix-images
pnpm fix-images -- --write
pnpm post-commit
```

建议流程：

1. 写文章或修改内容。
2. 如果插入了多张连续图片，运行 `pnpm fix-images -- --write`。
3. 只改文章时，可以运行 `pnpm post-commit`。
4. 如果同时改了代码或配置，先手动拆分提交。
5. 发布前需要确认站点可构建时，运行 `pnpm build`。
