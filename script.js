const API_URL = 'https://dummyjson.com/products';
const form = document.querySelector('#productForm');
const productId = document.querySelector('#productId');
const title = document.querySelector('#title');
const price = document.querySelector('#price');
const category = document.querySelector('#category');
const productList = document.querySelector('#productList');
const statusText = document.querySelector('#status');
const saveButton = document.querySelector('#saveButton');
const cancelButton = document.querySelector('#cancelButton');
const refreshButton = document.querySelector('#refreshButton');
let products = [];

function setStatus(message, type = '') {
  statusText.textContent = message;
  statusText.className = `status ${type}`;
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return response.json();
}

async function loadProducts() {
  setStatus('Loading product records...', 'loading');
  productList.innerHTML = '';
  try {
    const data = await request(`${API_URL}?limit=10`);
    products = data.products;
    renderProducts();
    setStatus('Records loaded successfully.', 'success');
  } catch (error) {
    setStatus(`Error loading records: ${error.message}`, 'error');
  }
}

function renderProducts() {
  productList.innerHTML = '';
  products.forEach(renderProduct);
}

function renderProduct(product) {
  const item = document.createElement('article');
  item.className = 'product';
  item.innerHTML = `
    <div><h3>${escapeHtml(product.title)}</h3>
    <p>₱${Number(product.price).toFixed(2)} · ${escapeHtml(product.category)}</p></div>
    <div class="actions"><button class="edit">Edit</button><button class="danger delete">Delete</button></div>`;
  item.querySelector('.edit').addEventListener('click', () => beginEdit(product));
  item.querySelector('.delete').addEventListener('click', () => deleteProduct(product.id));
  productList.appendChild(item);
}

function beginEdit(product) {
  productId.value = product.id;
  title.value = product.title;
  price.value = product.price;
  category.value = product.category;
  saveButton.textContent = 'Update Product';
  cancelButton.classList.remove('hidden');
  title.focus();
}

function resetForm() {
  form.reset();
  productId.value = '';
  saveButton.textContent = 'Add Product';
  cancelButton.classList.add('hidden');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = productId.value;
  const payload = { title: title.value.trim(), price: Number(price.value), category: category.value.trim() };
  const isEditing = Boolean(id);
  setStatus(isEditing ? 'Updating product...' : 'Adding product...', 'loading');
  try {
    const result = await request(isEditing ? `${API_URL}/${id}` : `${API_URL}/add`, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (isEditing) {
      products = products.map(product => product.id === Number(id) ? { ...product, ...payload } : product);
    } else {
      products.unshift({ ...payload, id: result.id || Date.now() });
    }
    renderProducts();
    setStatus(isEditing ? 'Product updated successfully.' : 'Product added successfully.', 'success');
    resetForm();
  } catch (error) {
    setStatus(`Error saving product: ${error.message}`, 'error');
  }
});

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  setStatus('Deleting product...', 'loading');
  try {
    await request(`${API_URL}/${id}`, { method: 'DELETE' });
    products = products.filter(product => product.id !== id);
    renderProducts();
    setStatus('Product deleted successfully.', 'success');
  } catch (error) {
    setStatus(`Error deleting product: ${error.message}`, 'error');
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

cancelButton.addEventListener('click', resetForm);
refreshButton.addEventListener('click', loadProducts);
loadProducts();
