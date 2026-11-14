
if(window.AOS){
  AOS.init({duration:1000,once:true});
  document.body.classList.add('aos-ready');
}

// Product data
const products=[
  {name:"Hydrating Cleanser",type:"cleanser",price:499,comparePrice:599,cat:"Bubble Relaxing Cleaxing Oil",img:"img/products/product1.jpg",desc:"Gentle formula removes impurities while keeping skin soft.",rating:4.7},
  {name:"Vitamin C Serum",type:"serum",price:699,comparePrice:899,cat:"Riche",img:"img/products/vitamin.jpg",desc:"Brightens and firms your skin for a glowing tone.",rating:4.9},
  {name:"Daily Moisturizer",type:"moisturizer",price:549,comparePrice:699,cat:"skin proud",img:"img/products/DailyMoisturizer.jpg",desc:"Lightweight hydration with SPF protection.",rating:4.6},
  {name:"Niacinamide Serum",type:"serum",price:649,comparePrice:799,cat:"minimalist",img:"img/products/NiacinamideSerum.jpg",desc:"Smooths texture and evens out skin tone.",rating:4.8},
  {name:"Gentle Foam Cleanser",type:"cleanser",price:449,comparePrice:549,cat:"WNP-Wake nature perfection",img:"img/products/hydrating.jpg",desc:"Refreshing foam that deeply cleanses pores.",rating:4.5},
  {name:"Rose Renewal Moisturizer",type:"moisturizer",price:799,comparePrice:949,cat:"Rose inc",img:"img/products/rose-renewal.jpg",desc:"Plumping cream infused with rosehip and ceramides.",rating:4.9},
  {name:"Glow Booster Serum",type:"serum",price:899,comparePrice:999,cat:"medicube",img:"img/products/glow-booster.jpg",desc:"Multi-peptide blend for instant luminosity and bounce.",rating:4.8},
  {name:"Balancing Gel Cleanser",type:"cleanser",price:539,comparePrice:649,cat:"tatcha",img:"img/products/balance-gel.jpg",desc:"pH-balanced gel that clears congestion without stripping.",rating:4.4},
  {name:"Hydra Cloud Moisturizer",type:"moisturizer",price:629,comparePrice:749,cat:"torriden",img:"img/products/hydra-cloud.jpg",desc:"Featherlight gel-cream that locks in hydration for 24h.",rating:4.6},
  {name:"Radiance Rescue Serum",type:"serum",price:759,comparePrice:899,cat:"sinsuru",img:"img/products/radiance-rescue.jpg",desc:"Vitamin B5 + licorice extract to calm and brighten dull skin.",rating:4.7},
  {name:"Smoothing Eye Cream",type:"treatment",price:399,comparePrice:499,cat:"glamfox",img:"img/products/eye-cream.jpg",desc:"Reduces puffiness and fine lines around the delicate eye area.",rating:4.5},
  {name:"Purifying Clay Cleanser",type:"treatment",price:579,comparePrice:699,cat:"Cera-V",img:"img/products/cleanser.jpg",desc:"Detoxifying clay formula that draws out impurities and excess oil.",rating:4.6}

];
const INITIAL_PRODUCT_COUNT=8;
let filteredProducts=[...products];
let currentSearch='';
let currentSort='default';
let showContent=false;
const productIndexMap=new Map(products.map((p,idx)=>[p.name,idx]));
let cart=(JSON.parse(localStorage.getItem('cart'))||[]).map(item=>{
  const meta=products.find(p=>p.name===item.name);
  return {...item,qty:item.qty||1,cat:item.cat||meta?.cat||'',comparePrice:meta?.comparePrice||item.comparePrice||item.price};
});
let alertTimer;

const checkoutOverlay=document.getElementById("checkoutOverlay");
const summaryList=document.getElementById("summaryList");
const summaryEmpty=document.getElementById("summaryEmpty");
const summarySubtotal=document.getElementById("summarySubtotal");
const summaryShipping=document.getElementById("summaryShipping");
const summaryTotal=document.getElementById("summaryTotal");
const summaryEta=document.getElementById("summaryEta");
const placeOrderBtn=document.getElementById("placeOrderBtn");
const successMessage=document.getElementById("successMessage");
const cardDetails=document.getElementById("cardDetails");
const codNote=document.getElementById("codNote");
const navSearch=document.getElementById("navSearch");
const sortSelectEl=document.getElementById("sortSelect");
const loadMoreButton=document.getElementById("loadMoreProducts");
const catalogEndState=document.getElementById("catalogEndState");
const alertBox=document.getElementById("globalAlert");
const alertMessageEl=document.getElementById("alertMessage");
const alertIconEl=document.getElementById("alertIcon");
const alertCloseBtn=document.getElementById("alertCloseBtn");
let checkoutStep=1;
const checkoutData={shipping:{},payment:{}};
let selectedPaymentMethod='card';
let currentOrderTotal=0;

function renderProducts(list){
  const grid=document.getElementById("productsGrid");
  if(!grid)return;
  grid.innerHTML="";
  if(catalogEndState)catalogEndState.hidden=true;
  if(list.length===0){
    grid.innerHTML=`
      <div class="col-12">
        <div class="empty-state">
          <i class="bi bi-stars"></i>
          <p>No products match your search just yet.<br><span>Try a different product name or keyword.</span></p>
        </div>
      </div>`;
    updateRevealControl(0);
    if(window.AOS){AOS.refresh();}
    return;
  }
  const visibleList=showContent?list:list.slice(0,INITIAL_PRODUCT_COUNT);
  visibleList.forEach((p,index)=>{
    const globalIndex=productIndexMap.get(p.name);
    grid.innerHTML+=`
    <article class="product-tile" data-aos="fade-up" data-aos-delay="${Math.min(index,5)*70}">
      <div class="product-media">
        <img src="${p.img}" alt="${p.name}" onclick="quickView(${globalIndex})" tabindex="0" role="button">
        
      </div>
      <div class="product-card-body">
        <p class="product-category">${p.cat}</p>
        <h3>${p.name}</h3>
        <div class="product-row">
          <div class="rating-wrap"><div class="rating-stars" aria-label="Rated ${p.rating} out of 5">${generateStars(p.rating)}</div><span class="rating-score">${Number(p.rating||0).toFixed(1)}</span></div>
          <p class="product-price" aria-label="Sale price ₱${p.price}, was ₱${p.comparePrice}"><del>₱${p.comparePrice}</del><strong>₱${p.price}</strong></p>
        </div>
        <button class="btn-order shimmer-button" data-button-feedback type="button" onclick="openAddModal(${globalIndex})"><svg class="button-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9" /></svg><svg class="button-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" /></svg><span class="button-label">Add to bag</span><i class="bi bi-bag-plus button-action-icon"></i></button>
      </div>
    </article>`;
  });
  updateRevealControl(list.length);
  if(catalogEndState)catalogEndState.hidden=list.length>INITIAL_PRODUCT_COUNT&&!showContent;
  if(window.AOS){AOS.refresh();}
}

function updateRevealControl(total){
  if(!loadMoreButton)return;
  const shouldShow=total>INITIAL_PRODUCT_COUNT&&!showContent;
  loadMoreButton.parentElement.hidden=!shouldShow;
}

function applyFilters(){
  showContent=false;
  const searchTerm=currentSearch.trim().toLowerCase();
  const base=products.filter(prod=>{
    if(!searchTerm)return true;
    return [prod.name,prod.cat,prod.type]
      .some(field=>String(field).toLowerCase().includes(searchTerm));
  });

  let result=[...base];
  if(currentSort==='low'){
    result.sort((a,b)=>a.price-b.price);
  }else if(currentSort==='high'){
    result.sort((a,b)=>b.price-a.price);
  }

  filteredProducts=result;
  renderProducts(filteredProducts);
}

if(loadMoreButton){
  loadMoreButton.addEventListener('click',()=>{
    showContent=true;
    renderProducts(filteredProducts);
  });
}

if(navSearch){
  navSearch.addEventListener('input',e=>{
    currentSearch=e.target.value;
    applyFilters();
  });
  navSearch.addEventListener('search',e=>{
    currentSearch=e.target.value;
    applyFilters();
  });
}

if(sortSelectEl){
  sortSelectEl.addEventListener('change',e=>{
    currentSort=e.target.value||'default';
    applyFilters();
  });
}

function quickView(i){
  const p=products[i];
  document.getElementById("quickImg").src=p.img;
  document.getElementById("quickName").innerText=p.name;
  const quickRating=document.getElementById("quickRating");
  if(quickRating){
    quickRating.innerHTML=generateStars(p.rating);
    quickRating.setAttribute('aria-label',`Rated ${p.rating} out of 5`);
  }
  const quickPrice=document.getElementById("quickPrice");
  quickPrice.innerHTML=`<del>${formatCurrency(p.comparePrice)}</del><strong>${formatCurrency(p.price)}</strong>`;
  quickPrice.setAttribute('aria-label',`Sale price ${formatCurrency(p.price)}, was ${formatCurrency(p.comparePrice)}`);
  document.getElementById("quickDesc").innerText=p.desc;
  const modal=new bootstrap.Modal(document.getElementById("quickViewModal"));
  modal.show();
  localStorage.setItem("quickItem",JSON.stringify(p));
}
function closeQuickView(){
  const modalEl=document.getElementById("quickViewModal");
  if(!modalEl)return;
  const instance=bootstrap.Modal.getInstance(modalEl)||new bootstrap.Modal(modalEl);
  instance.hide();
  localStorage.removeItem("quickItem");
}
function addToCartFromQuick(){
  const item=JSON.parse(localStorage.getItem("quickItem"));
  if(!item)return;
  const productIndex=productIndexMap.get(item.name);
  const quickModal=document.getElementById("quickViewModal");
  quickModal.addEventListener('hidden.bs.modal',()=>openAddModal(productIndex),{once:true});
  closeQuickView();
}
let pendingProduct=null;
function openAddModal(index){
  pendingProduct=products[index];
  document.getElementById("addModalImg").src=pendingProduct.img;
  document.getElementById("addModalImg").alt=pendingProduct.name;
  document.getElementById("addModalCategory").textContent=pendingProduct.cat;
  document.getElementById("addModalName").textContent=pendingProduct.name;
  document.getElementById("addModalRating").innerHTML=generateStars(pendingProduct.rating);
  document.getElementById("addModalRating").setAttribute('aria-label',`Rated ${pendingProduct.rating} out of 5`);
  document.getElementById("addModalPrice").innerHTML=`<del>${formatCurrency(pendingProduct.comparePrice)}</del><strong>${formatCurrency(pendingProduct.price)}</strong>`;
  document.getElementById("addQuantity").value=1;
  new bootstrap.Modal(document.getElementById("addToBagModal")).show();
}
function adjustPendingQuantity(change){
  const field=document.getElementById("addQuantity");
  field.value=Math.max(1,(parseInt(field.value,10)||1)+change);
}
function confirmAddToBag(){
  if(!pendingProduct)return;
  const quantity=Math.max(1,parseInt(document.getElementById("addQuantity").value,10)||1);
  addToCart(pendingProduct.name,pendingProduct.price,pendingProduct.img,quantity);
  bootstrap.Modal.getInstance(document.getElementById("addToBagModal"))?.hide();
  pendingProduct=null;
}
function addToCart(name,price,img,quantity=1){
  const existing=cart.find(i=>i.name===name);
  const meta=products.find(p=>p.name===name);
  if(existing){existing.qty+=quantity;existing.comparePrice=meta?.comparePrice||existing.comparePrice||price;}else{cart.push({name,price,img,qty:quantity,cat:meta?.cat||'',comparePrice:meta?.comparePrice||price});}
  persistCart();
  showToast("Added to cart","success");
  if(checkoutOverlay.classList.contains("active")){renderCartSummary();}
}
function mapVariantToIcon(variant){
  switch(variant){
    case 'danger':return 'bi-exclamation-triangle-fill';
    case 'warning':return 'bi-exclamation-circle-fill';
    case 'info':return 'bi-info-circle-fill';
    default:return 'bi-check-circle-fill';
  }
}

function showToast(message,variant='success'){
  if(!alertBox||!alertMessageEl)return;
  const finalVariant=['success','danger','warning','info'].includes(variant)?variant:'success';
  alertBox.classList.remove('alert-success','alert-danger','alert-warning','alert-info','d-none','show');
  alertBox.classList.add(`alert-${finalVariant}`);
  if(alertIconEl){
    alertIconEl.className=`bi ${mapVariantToIcon(finalVariant)}`;
  }
  alertMessageEl.textContent=message;
  void alertBox.offsetWidth;
  alertBox.classList.add('show');
  clearTimeout(alertTimer);
  alertTimer=setTimeout(()=>{
    alertBox.classList.remove('show');
    alertTimer=setTimeout(()=>{
      alertBox.classList.add('d-none');
    },180);
  },2600);
}

if(alertCloseBtn&&alertBox){
  alertCloseBtn.addEventListener('click',()=>{
    alertBox.classList.remove('show');
    alertBox.classList.add('d-none');
    clearTimeout(alertTimer);
  });
}

function updateCartCount(){
  const count=cart.reduce((sum,item)=>sum+(item.qty||1),0);
  document.getElementById("cartCount").innerText=count;
}

function persistCart(){
  localStorage.setItem('cart',JSON.stringify(cart));
  updateCartCount();
  renderCartSummary();
}

function formatCurrency(value){
  return "₱"+Number(value||0).toLocaleString();
}

function generateStars(rating=0){
  const full=Math.floor(rating);
  const hasHalf=rating-full>=0.5;
  let html="";
  for(let i=0;i<full;i++){html+='<i class="bi bi-star-fill"></i>';}
  if(hasHalf){html+='<i class="bi bi-star-half"></i>';}
  const empty=5-full-(hasHalf?1:0);
  for(let i=0;i<empty;i++){html+='<i class="bi bi-star"></i>';}
  return html;
}

function updatePlaceOrderCta(){
  if(!placeOrderBtn)return;
  const labelEl=document.getElementById('placeOrderLabel');
  if(cart.length===0){
    labelEl.textContent="Add items to continue";
    placeOrderBtn.disabled=true;
    return;
  }
  const buttonText=selectedPaymentMethod==='cod'?"Confirm COD order":"Place secure order";
  labelEl.textContent=`${buttonText} · ${formatCurrency(currentOrderTotal)}`;
  placeOrderBtn.disabled=false;
}

function renderCartSummary(){
  if(!summaryList)return;
  summaryList.innerHTML="";
  let subtotal=0;
  cart.forEach((item,index)=>{
    const qty=item.qty||1;
    const lineTotal=item.price*qty;
    subtotal+=lineTotal;
    summaryList.innerHTML+=`
      <div class="summary-item">
        <img src="${item.img}" alt="${item.name}" class="summary-thumb">
        <div class="summary-info">
          <div class="summary-name">${item.name}</div>
          <div class="summary-prices" aria-label="Sale price ${formatCurrency(item.price)}, was ${formatCurrency(item.comparePrice||item.price)}"><del>${formatCurrency(item.comparePrice||item.price)}</del><strong>${formatCurrency(item.price)}</strong></div>
          <div class="summary-meta">${item.cat||'GlowAura favorite'}</div>
          <div class="summary-actions">
            <div class="qty-chip">
              <button type="button" onclick="changeQty(${index},-1)">−</button>
              <span>${qty}</span>
              <button type="button" onclick="changeQty(${index},1)">+</button>
            </div>
            <button class="remove-btn" type="button" onclick="removeItem(${index})">Remove</button>
          </div>
        </div>
        <div class="summary-total fw-semibold">${formatCurrency(lineTotal)}</div>
      </div>`;
  });

  const hasItems=cart.length>0;
  summaryEmpty.style.display=hasItems?"none":"flex";
  const shipping=subtotal===0?0:(subtotal>=1500?0:120);
  const etaText=subtotal===0?"—":(shipping===0?"1-3 days":"3-5 days");
  summarySubtotal.innerText=formatCurrency(subtotal);
  summaryShipping.innerText=shipping===0?"Free":formatCurrency(shipping);
  summaryTotal.innerText=formatCurrency(subtotal+shipping);
  summaryEta.innerText=etaText;
  currentOrderTotal=subtotal+shipping;
  updatePlaceOrderCta();

  const continueBtn=document.querySelector('.step-pane[data-step="1"] .btn-modern');
  if(continueBtn){continueBtn.disabled=!hasItems;}
}

function selectPaymentMethod(method,button){
  selectedPaymentMethod=method;
  if(button){button.blur();}
  document.querySelectorAll('.method-pill').forEach(pill=>{
    const isActive=pill.dataset.method===method;
    pill.classList.toggle('active',isActive);
    pill.setAttribute('aria-pressed',isActive);
  });
  if(cardDetails){
    cardDetails.classList.toggle('collapsed',method!=='card');
  }
  if(codNote){
    codNote.classList.toggle('show',method==='cod');
  }
  updatePlaceOrderCta();
}

function changeQty(index,delta){
  const item=cart[index];
  if(!item)return;
  item.qty=(item.qty||1)+delta;
  if(item.qty<=0){cart.splice(index,1);}
  persistCart();
  if(cart.length===0 && checkoutOverlay.classList.contains("active")){
    goToStep(1);
  }
}

function removeItem(index){
  cart.splice(index,1);
  persistCart();
  if(cart.length===0 && checkoutOverlay.classList.contains("active")){
    goToStep(1);
  }
}

function toggleCart(){
  if(checkoutOverlay.classList.contains("active")){
    closeCheckout();
  }else{
    openCheckout();
  }
}

function openCheckout(){
  if(cart.length===0){
  showToast("Your bag is empty. Add some glow first ✨","info");
    return;
  }
  checkoutOverlay.classList.add("active");
  document.body.classList.add("no-scroll");
  checkoutOverlay.classList.remove("complete");
  renderCartSummary();
  goToStep(1);
}

function closeCheckout(){
  checkoutOverlay.classList.remove("active","complete");
  document.body.classList.remove("no-scroll");
  resetCheckoutForm();
}

checkoutOverlay.addEventListener('click',e=>{
  if(e.target===checkoutOverlay){closeCheckout();}
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&checkoutOverlay.classList.contains('active')){
    closeCheckout();
  }
});

function goToStep(step){
  checkoutStep=step;
  document.querySelectorAll('.step-pane').forEach(p=>{
    p.classList.toggle('active',Number(p.dataset.step)===step);
  });
  document.querySelectorAll('.step-pill').forEach(p=>{
    const stepNumber=Number(p.dataset.step);
    p.classList.toggle('active',stepNumber===step);
    p.classList.toggle('completed',stepNumber<step);
  });
}

function nextStep(){
  if(cart.length===0){showToast("Add an item before checking out.","warning");return;}
  const shipping={
    name:document.getElementById('shipName').value.trim(),
    email:document.getElementById('shipEmail').value.trim(),
    phone:document.getElementById('shipPhone').value.trim(),
    city:document.getElementById('shipCity').value.trim(),
    address:document.getElementById('shipAddress').value.trim(),
    zip:document.getElementById('shipZip').value.trim(),
    notes:document.getElementById('shipNotes').value.trim()
  };

  if(!shipping.name||!shipping.email||!shipping.phone||!shipping.city||!shipping.address||!shipping.zip){
  showToast("Complete your delivery details to continue.","warning");
    return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)){
  showToast("Enter a valid email address.","warning");
    return;
  }
  if(shipping.phone.replace(/\D/g,"" ).length<10){
  showToast("Enter a valid phone number.","warning");
    return;
  }

  checkoutData.shipping=shipping;
  goToStep(2);
}

function prevStep(){
  if(checkoutStep>1){goToStep(checkoutStep-1);}
}

function placeOrder(){
  if(cart.length===0){showToast("Your bag is empty.","info");return;}
  const notes=document.getElementById('orderNotes').value.trim();
  const payment={
    method:selectedPaymentMethod,
    notes
  };

  if(selectedPaymentMethod==='card'){
    const cardName=document.getElementById('payName').value.trim();
    const cardNumber=document.getElementById('payNumber').value.replace(/\s+/g,'');
    const expiry=document.getElementById('payExpiry').value.trim();
    const cvv=document.getElementById('payCVV').value.trim();

    if(!cardName||!cardNumber||!expiry||!cvv){
  showToast("Kindly complete your payment details.","warning");
      return;
    }
    if(cardNumber.length<12){
  showToast("Card number looks too short.","warning");
      return;
    }
    if(!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)){
  showToast("Use MM/YY format for expiry.","warning");
      return;
    }
    if(cvv.length<3){
  showToast("CVV should be 3 or 4 digits.","warning");
      return;
    }

    payment.cardName=cardName;
    payment.cardNumber=cardNumber;
    payment.expiry=expiry;
    payment.cvv=cvv;
  }else{
    payment.cardName='';
    payment.cardNumber='';
    payment.expiry='';
    payment.cvv='';
  }

  checkoutData.payment=payment;
  placeOrderBtn.classList.add('is-loading');
  placeOrderBtn.setAttribute('aria-busy','true');
  setTimeout(()=>{
    placeOrderBtn.classList.remove('is-loading');
    placeOrderBtn.classList.add('is-success');
    document.getElementById('placeOrderLabel').textContent='Order confirmed';
    placeOrderBtn.removeAttribute('aria-busy');
    setTimeout(finalizeOrder,900);
  },550);
}

function finalizeOrder(){
  const subtotal=cart.reduce((sum,item)=>sum+item.price*(item.qty||1),0);
  const shipping=subtotal===0?0:(subtotal>=1500?0:120);
  const total=subtotal+shipping;
  const firstName=checkoutData.shipping.name.split(' ')[0]||'Glowfriend';
  const arrivalText=shipping===0?"arriving in 1-3 days":"arriving in 3-5 days";
  const method=checkoutData.payment.method||'card';
  const paymentLine=method==='cod'
    ?`Pay ${formatCurrency(total)} on delivery • ${arrivalText}`
    :`${formatCurrency(total)} charged • ${arrivalText}`;
  successMessage.innerHTML=`Thanks, <strong>${firstName}</strong>!<br><span style="display:block;margin-top:10px;font-size:0.95rem;opacity:0.85;">${paymentLine}</span>`;
  checkoutOverlay.classList.add('complete');
  triggerSuccessBurst();

  cart=[];
  persistCart();
  resetCheckoutForm();

  setTimeout(()=>{
    closeCheckout();
  },3000);
}

function resetCheckoutForm(){
  placeOrderBtn.classList.remove('is-loading','is-success');
  placeOrderBtn.removeAttribute('aria-busy');
  updatePlaceOrderCta();
  document.querySelectorAll('#checkoutOverlay input, #checkoutOverlay textarea').forEach(field=>{
    if(field.id.startsWith('ship')||field.id.startsWith('pay')||field.id==='orderNotes'){
      field.value='';
    }
  });
  checkoutData.shipping={};
  checkoutData.payment={};
  selectPaymentMethod('card');
  goToStep(1);
}

function triggerSuccessBurst(){
  const card=document.querySelector('.success-card');
  if(!card)return;
  const burst=document.createElement('div');
  burst.className='success-burst';
  const icons=['✨','🌸','💗','💫','🌿'];
  for(let i=0;i<18;i++){
    const particle=document.createElement('span');
    particle.className='success-particle';
    particle.textContent=icons[i%icons.length];
    particle.style.left=Math.random()*100+'%';
    particle.style.bottom=Math.random()*30+'px';
    particle.style.animationDelay=(Math.random()*0.3)+'s';
    particle.style.fontSize=(1.1+Math.random()*0.6)+'rem';
    burst.appendChild(particle);
  }
  card.appendChild(burst);
  setTimeout(()=>burst.remove(),1700);
}

function formatCardNumber(input){
  let value=input.value.replace(/[^0-9]/g,'').slice(0,16);
  const groups=value.match(/.{1,4}/g);
  input.value=groups?groups.join(' '):'';
}

function formatExpiry(input){
  let value=input.value.replace(/[^0-9]/g,'').slice(0,4);
  if(value.length>=3){
    value=value.slice(0,2)+'/'+value.slice(2);
  }
  input.value=value;
}

applyFilters();
updateCartCount();
renderCartSummary();
if(window.AOS){
  if(typeof AOS.refreshHard==='function'){AOS.refreshHard();}
  window.dispatchEvent(new Event('scroll'));
}
