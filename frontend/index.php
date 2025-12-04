<?php
$apiUrl = getenv('API_URL') ?: 'http://localhost:8000';
?>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Meme Generator</title>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <main class="container">
    <header class="app-header">
      <h1>Meme Generator</h1>
      <p class="subtitle">Tạo meme nhanh — upload ảnh, chỉnh text, kéo để đặt vị trí, xem trước và tải về.</p>
    </header>

    <div class="layout">
      <aside class="panel">
        <div class="field">
          <label class="file-label">Chọn ảnh
            <input id="fileInput" type="file" accept="image/*">
          </label>
        </div>

        <div class="field samples">
          <div class="label">Ảnh mẫu</div>
          <div class="sample-list">
            <button class="sample" data-sample="1">Mẫu 1</button>
            <button class="sample" data-sample="2">Mẫu 2</button>
            <button class="sample" data-sample="3">Mẫu 3</button>
          </div>
        </div>

        <div class="field text-inputs">
          <label>Text trên: <input id="topText" type="text" placeholder="Top text"></label>
          <label>Text dưới: <input id="bottomText" type="text" placeholder="Bottom text"></label>
        </div>

        <div class="field controls-row">
          <label>Font: 
            <select id="fontFamily">
              <option value="Impact, Arial">Impact</option>
              <option value="Anton, Impact, Arial">Anton</option>
              <option value="Roboto, Arial">Roboto</option>
            </select>
          </label>

          <label>Font size: <input id="fontSize" type="range" min="16" max="96" value="48"><span id="fontSizeVal">48</span>px</label>
        </div>

        <div class="field controls-row">
          <label>Font color: <input id="fontColor" type="color" value="#ffffff"></label>
          <button id="resetPos" class="btn-light">Reset vị trí</button>
        </div>

        <div class="field actions">
          <button id="downloadPreview" class="btn">Tải preview</button>
          <button id="createBtn" class="btn primary">Tạo & Lưu (server)</button>
        </div>
      </aside>

      <section class="preview">
        <h2>Preview</h2>
        <div class="canvas-wrap">
          <canvas id="previewCanvas" width="600" height="400"></canvas>
        </div>
        <div id="status" class="status"></div>

        <div id="generatedResult" class="generated-result" aria-live="polite"></div>
      </section>
    </div>
  </main>

  <script>
    // API URL injected from PHP so it works from host/browser
    const API_URL = '<?php echo addslashes($apiUrl); ?>';
  </script>
  <script src="assets/js/app.js"></script>
</body>
</html>
