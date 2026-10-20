'use strict';
const imageDialog = document.getElementById('imageDialog');
const expandedImage = document.getElementById('expandedImage');
const imageCaption = document.getElementById('imageCaption');
document.querySelectorAll('[data-image]').forEach(button => {
  button.addEventListener('click', () => {
    expandedImage.src = button.dataset.image;
    expandedImage.alt = button.querySelector('img').alt;
    imageCaption.textContent = button.dataset.caption;
    imageDialog.showModal();
  });
});
document.getElementById('closeImage').addEventListener('click', () => imageDialog.close());
imageDialog.addEventListener('click', event => {
  if (event.target === imageDialog) imageDialog.close();
});
