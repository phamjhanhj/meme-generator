const fileInput = document.getElementById('fileInput');
const sampleButtons = document.querySelectorAll('.sample');
const topTextInput = document.getElementById('topText');
const bottomTextInput = document.getElementById('bottomText');
const fontSizeInput = document.getElementById('fontSize');
const fontSizeVal = document.getElementById('fontSizeVal');
const fontColorInput = document.getElementById('fontColor');
const resetPosBtn = document.getElementById('resetPos');
const createBtn = document.getElementById('createBtn');
const downloadPreviewBtn = document.getElementById('downloadPreview');
const fontFamilySel = document.getElementById('fontFamily');
const statusEl = document.getElementById('status');
const generatedResult = document.getElementById('generatedResult');

const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

let image = new Image();
let scale = 1;

const topText = { text: '', x: 50, y: 60, dragging: false };
const bottomText = { text: '', x: 50, y: 320, dragging: false };

function setStatus(msg){ statusEl.textContent = msg; }

function fitCanvasToImage(img){
  const maxW = 800; const maxH = 600;
  let w = img.width, h = img.height;
  const ratio = Math.min(maxW / w, maxH / h, 1);
  canvas.width = Math.round(w * ratio);
  canvas.height = Math.round(h * ratio);
  scale = ratio;
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(image && image.src){
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#222'; ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  const fontSize = parseInt(fontSizeInput.value,10) || 48;
  const fontFamily = fontFamilySel ? fontFamilySel.value : 'Impact, Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = fontColorInput.value;
  ctx.lineWidth = Math.max(2, Math.round(fontSize/12));
  ctx.strokeStyle = 'black';

  ctx.font = `${fontSize}px ${fontFamily}`;

  // draw text with outline for readability — use uppercase by default for meme style
  const drawLine = (txtObj) => {
    const txt = (txtObj.text || '').toString();
    if(!txt) return;
    const lines = txt.split('\n');
    let y = txtObj.y;
    for(const line of lines){
      // outline
      ctx.strokeText(line, txtObj.x, y);
      ctx.fillText(line, txtObj.x, y);
      y += fontSize;
    }
  }

  drawLine(topText);
  drawLine(bottomText);
}

function loadFile(file){
  const reader = new FileReader();
  reader.onload = () => {
    image = new Image();
    image.onload = () => { fitCanvasToImage(image); resetPositions(); draw(); };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

fileInput.addEventListener('change', (e)=>{
  const f = e.target.files && e.target.files[0];
  if(f) loadFile(f);
});

// sample image (simple SVG data URI)
const sampleSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
    <rect width='100%' height='100%' fill='#4a90e2'/>
    <circle cx='400' cy='300' r='120' fill='#ffd54f'/>
  </svg>
`)}`;

sampleButtons.forEach(btn => btn.addEventListener('click', ()=>{
  const id = btn.getAttribute('data-sample');
  // simple variations of the sample SVG
  const variants = {
    '1': `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
        <rect width='100%' height='100%' fill='#4a90e2'/>
        <circle cx='400' cy='300' r='120' fill='#ffd54f'/>
      </svg>
    `)}`,
    '2': `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
        <rect width='100%' height='100%' fill='#111827'/>
        <text x='50%' y='50%' fill='#fff' font-size='48' text-anchor='middle' dominant-baseline='middle'>Sample 2</text>
      </svg>
    `)}`,
    '3': `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
        <linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='#f97316'/><stop offset='1' stop-color='#f43f5e'/></linearGradient>
        <rect width='100%' height='100%' fill='url(#g)'/>
      </svg>
    `)}`
  };
  image = new Image();
  image.onload = ()=>{ fitCanvasToImage(image); resetPositions(); draw(); };
  image.src = variants[id] || variants['1'];
}));

function resetPositions(){
  topText.x = 20; topText.y = 20;
  bottomText.x = 20; bottomText.y = canvas.height - (parseInt(fontSizeInput.value,10)||48) - 20;
}

// drag handling
let draggingTarget = null;
function getTextBox(textObj){
  const fontSize = parseInt(fontSizeInput.value,10) || 48;
  const fontFamily = fontFamilySel ? fontFamilySel.value : 'Impact, Arial';
  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(textObj.text || '');
  const w = metrics.width; const h = fontSize;
  return { x: textObj.x, y: textObj.y, w, h };
}

function pointerDown(e){
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left);
  const y = (e.clientY - rect.top);
  // check top
  if(topText.text){
    const b = getTextBox(topText);
    if(x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h){ draggingTarget = topText; return; }
  }
  if(bottomText.text){
    const b = getTextBox(bottomText);
    if(x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h){ draggingTarget = bottomText; return; }
  }
}

function pointerMove(e){
  if(!draggingTarget) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left);
  const y = (e.clientY - rect.top);
  draggingTarget.x = x - 10;
  draggingTarget.y = y - 10;
  draw();
}

function pointerUp(){ draggingTarget = null; }

canvas.addEventListener('pointerdown', pointerDown);
window.addEventListener('pointermove', pointerMove);
window.addEventListener('pointerup', pointerUp);

// update when inputs change
topTextInput.addEventListener('input', (e)=>{ topText.text = e.target.value; draw(); });
bottomTextInput.addEventListener('input', (e)=>{ bottomText.text = e.target.value; draw(); });
fontSizeInput.addEventListener('input', ()=>{ fontSizeVal.textContent = fontSizeInput.value; resetPositions(); draw(); });
fontColorInput.addEventListener('input', draw);
fontFamilySel.addEventListener('change', draw);
resetPosBtn.addEventListener('click', ()=>{ resetPositions(); draw(); });

// download preview locally
downloadPreviewBtn.addEventListener('click', ()=>{
  canvas.toBlob((blob)=>{
    if(!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'meme-preview.png';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
});

createBtn.addEventListener('click', async ()=>{
  setStatus('Đang gửi ảnh tới server...');
  generatedResult.innerHTML = '';
  createBtn.disabled = true;
  canvas.toBlob(async (blob)=>{
    if(!blob){ setStatus('Không thể tạo ảnh.'); createBtn.disabled = false; return; }
    const fd = new FormData();
    fd.append('meme', blob, 'meme.png');
    fd.append('topText', topText.text);
    fd.append('bottomText', bottomText.text);
    fd.append('fontSize', fontSizeInput.value);
    fd.append('fontColor', fontColorInput.value);
    fd.append('topX', topText.x);
    fd.append('topY', topText.y);
    fd.append('bottomX', bottomText.x);
    fd.append('bottomY', bottomText.y);

    try{
      const res = await fetch(API_URL + '/create-meme', { method: 'POST', body: fd });
      if(!res.ok){ setStatus('Backend trả lỗi: ' + res.status); createBtn.disabled = false; return; }
      const blobOut = await res.blob();
      const url = URL.createObjectURL(blobOut);
      const img = document.createElement('img'); img.src = url; img.alt = 'meme';
      const link = document.createElement('a'); link.href = url; link.download = 'meme.png'; link.textContent = 'Tải meme';
      generatedResult.appendChild(img); generatedResult.appendChild(link);
      setStatus('Hoàn tất — xem ảnh bên dưới.');
    }catch(err){ setStatus('Lỗi khi gửi yêu cầu: ' + err.message); }
    createBtn.disabled = false;
  }, 'image/png');
});

// initial blank canvas
image = new Image(); image.onload = ()=>{ fitCanvasToImage(image); resetPositions(); draw(); };
// blank background
image.src = '';
fitCanvasToImage({width:600,height:400}); resetPositions(); draw();
