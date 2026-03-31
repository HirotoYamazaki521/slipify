# 要件定義書

## プロジェクト説明（入力）
現在フロント画面の見た目が地味ですし、文字を入力するとき灰色になってみづらい　GUI周りみなおしたい

## はじめに

SlipifyはNext.js App Routerで構築されたレシート管理Webアプリである。現在のUIはTailwind CSSを使った最小限の白背景デザインで統一されており、次の課題がある：

1. **入力フィールドの視認性低下**: テキスト入力時に明示的な文字色が指定されておらず、ブラウザ依存で灰色に見える
2. **全体デザインが地味**: 白一色の背景・無彩色の構成で、アプリとしての視覚的な魅力に欠ける
3. **デザインシステムの欠如**: ページ間で統一されたカラーパレット・余白・タイポグラフィの基準がない
4. **モバイル対応の不足**: 現在のレイアウトはPC幅前提で設計されており、スマートフォンでの操作性が考慮されていない

本仕様では、既存の機能を維持しながらGUI全体を刷新し、視認性・使いやすさ・視覚的魅力を高める。

---

## 要件

### 要件 1: 入力フィールドの視認性改善

**目的**: ユーザーとして、テキストを入力するときに文字がはっきりと読めるようにしたい。そうすれば、入力内容を確認しやすくなる。

#### 受け入れ基準

1. The Slipify UI shall render input field text in a color with sufficient contrast (WCAG AA: contrast ratio ≥ 4.5:1) against the field background at all times.
2. When a user focuses an input field, the Slipify UI shall display a clearly visible focus ring that distinguishes the active field from surrounding elements.
3. The Slipify UI shall apply consistent text color (`text-gray-900` or equivalent dark tone) to all `<input>`, `<select>`, and `<textarea>` elements across every page.
4. When a user types text into an input field, the Slipify UI shall display the typed characters in the same dark text color as the label text above the field.
5. The Slipify UI shall use a distinct placeholder style (e.g., `text-gray-400`) that is visually different from typed input text so users can distinguish placeholder from entered content.

---

### 要件 2: 全体カラーテーマの確立

**目的**: ユーザーとして、アプリ全体に統一感のある配色を感じたい。そうすれば、Slipifyらしいブランドイメージとともに使いやすさが向上する。

#### 受け入れ基準

1. The Slipify UI shall apply a consistent primary color palette across all pages and components (e.g., a defined primary, secondary, background, and surface color).
2. The Slipify UI shall use a non-white page background (e.g., light gray `bg-gray-50` or a subtle gradient) to create visual depth and avoid the flat all-white look.
3. When a primary action button is rendered, the Slipify UI shall style it with the primary brand color and a hover state that provides clear visual feedback.
4. The Slipify UI shall not mix ad-hoc colors across components; all colors shall reference the established palette or Tailwind CSS design tokens.

---

### 要件 3: ページレイアウト・背景デザインの改善

**目的**: ユーザーとして、各ページが整然としていて視覚的に引き付けられるレイアウトで表示されてほしい。そうすれば、アプリを使うモチベーションが上がる。

#### 受け入れ基準

1. The Slipify UI shall wrap the main content area in a styled layout container that provides consistent horizontal padding, max-width, and vertical spacing on all authenticated pages.
2. The Slipify UI shall display a global navigation header on all authenticated pages, showing the app logo/name and a logout link.
3. When a page contains a primary heading (`h1`), the Slipify UI shall render it with a prominent text size and weight that establishes clear visual hierarchy above body content.
4. The Slipify UI shall style card-like containers (e.g., FilterPanel, ReceiptCard, summary panels) with a white background, subtle border or shadow, and rounded corners to lift them visually from the page background.
5. The Slipify UI shall render the unauthenticated landing/auth pages with a styled background (e.g., gradient or brand color) that distinguishes them from the main app pages.

---

### 要件 4: 認証画面（ログイン・新規登録）のデザイン改善

**目的**: ユーザーとして、ログイン・新規登録画面が洗練された見た目であってほしい。そうすれば、最初の印象が良くなり安心してアカウントを作成できる。

#### 受け入れ基準

1. The Slipify UI shall center the login and signup forms on a visually distinct background (e.g., gradient or brand-colored backdrop) rather than a plain white page.
2. The Slipify UI shall display the Slipify logo or app name prominently above the form card on the auth pages.
3. When the auth form card is rendered, the Slipify UI shall apply a white card style with adequate padding, rounded corners, and a subtle shadow.
4. When an error message is displayed in an auth form, the Slipify UI shall render it in a clearly visible error style (e.g., red-tinted background with contrasting text).

---

### 要件 5: フォームコンポーネントの統一スタイル

**目的**: ユーザーとして、フォーム要素（ボタン・入力・ラベル）が一貫したスタイルで表示されてほしい。そうすれば、どのページでも迷わず操作できる。

#### 受け入れ基準

1. The Slipify UI shall apply a uniform button style for primary actions (solid fill, brand color, rounded) and secondary actions (outline or ghost style) across all forms and pages.
2. The Slipify UI shall apply a uniform input style (border, padding, rounded corners, dark text, placeholder style, focus ring) to all text, email, password, date, and file inputs.
3. When a button is in a disabled state, the Slipify UI shall display it with reduced opacity (`opacity-50`) and a `not-allowed` cursor.
4. While a form is submitting, the Slipify UI shall display a loading indicator inside the submit button and disable all interactive form elements.
5. The Slipify UI shall style form labels consistently with a medium-weight, dark-gray font above their associated inputs.

---

### 要件 6: レシートカード・一覧画面のビジュアル改善

**目的**: ユーザーとして、レシート一覧で各レシートの情報が読みやすく整理されて表示されてほしい。そうすれば、素早く目的のレシートを見つけられる。

#### 受け入れ基準

1. When the receipts list page is rendered, the Slipify UI shall display each receipt as a styled card with store name, date, and total amount clearly visible at a glance.
2. The Slipify UI shall use typographic hierarchy (font size, weight, color) to distinguish the store name (primary), total amount (emphasized), and date/category (secondary) within each receipt card.
3. When a receipt card is hovered, the Slipify UI shall show a subtle hover state (e.g., shadow elevation change or background tint) to indicate interactivity.
4. The Slipify UI shall render an empty state illustration or message (not just blank space) when no receipts match the current filter.

---

### 要件 7: モバイルレスポンシブ対応

**目的**: ユーザーとして、スマートフォンからでも快適にSlipifyを操作したい。そうすれば、外出先でレシートをすぐに取り込んで管理できる。

#### 受け入れ基準

1. The Slipify UI shall display all pages in a readable, usable layout on viewport widths from 375px (iPhone SE) and above without horizontal scrolling.
2. When the viewport width is below 640px, the Slipify UI shall stack multi-column layouts (e.g., summary panels grid) into a single-column layout.
3. When the viewport width is below 640px, the Slipify UI shall render navigation items and action buttons at a touch-friendly tap target size (minimum 44×44px).
4. The Slipify UI shall use Tailwind CSS responsive prefixes (`sm:`, `md:`, `lg:`) to define breakpoint-specific styles rather than fixed pixel widths.
5. When a user accesses the receipt upload page on a mobile device, the Slipify UI shall render the file input and submit button at full width for easy one-thumb operation.
6. When the filter panel is displayed on a mobile viewport, the Slipify UI shall lay out the date range inputs and category tag buttons in a vertically scrollable, single-column arrangement.
7. The Slipify UI shall render text at a minimum font size of 14px (Tailwind `text-sm`) on mobile to maintain legibility without zooming.
