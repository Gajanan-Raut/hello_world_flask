async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/upload', {method:'POST', body:fd});
  return res.json();
}

async function doAction(action) {
  const fileInput = document.getElementById('fileInput');
  if (!fileInput.files.length) return alert('Please choose a file first');

  const file = fileInput.files[0];
  const fd = new FormData();
  fd.append('file', file);

  if (action === 'merge') {
    // For merge, allow multiple files
    const files = fileInput.files;
    const fd2 = new FormData();
    for (let i=0;i<files.length;i++) fd2.append('files', files[i]);
    const r = await fetch('/merge', {method:'POST', body:fd2});
    const blob = await r.blob();
    downloadBlob(blob, 'merged.pdf');
    return;
  }

  if (action === 'watermark') {
    const text = prompt('Watermark text', 'Sample Watermark');
    fd.append('text', text || 'Watermark');
  }
  if (action === 'rotate') fd.append('degrees', '90');
  if (action === 'protect') {
    const pwd = prompt('Password to add', 'secret');
    fd.append('password', pwd || 'secret');
  }
  if (action === 'unlock') {
    const pwd = prompt('Password (owner password) if known', '');
    fd.append('password', pwd || '');
  }

  const r = await fetch('/' + action, {method:'POST', body:fd});
  if (r.status !== 200) {
    const txt = await r.text();
    alert('Error: ' + txt);
    return;
  }
  try {
    const blob = await r.blob();
    const disposition = r.headers.get('content-disposition') || '';
    const filename = (disposition.match(/filename=(.*)/) || [])[1] || action + '.bin';
    downloadBlob(blob, filename.replace(/\"/g,''));
  } catch(e) {
    const json = await r.json();
    document.getElementById('resultArea').innerText = JSON.stringify(json, null, 2);
  }
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

document.getElementById('uploadBtn').addEventListener('click', async () => {
  const fi = document.getElementById('fileInput');
  if (!fi.files.length) return alert('Choose a file');
  const res = await uploadFile(fi.files[0]);
  document.getElementById('uploadResult').innerText = JSON.stringify(res);
});
