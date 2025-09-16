// تكوين Supabase - ضع مفاتيحك هنا (استخدم مفاتيح الواجهة العامة anon key)
const SUPABASE_URL = 'https://xvypmefacfzluuedusmg.supabase.co'; // عدل
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2eXBtZWZhY2Z6bHV1ZWR1c21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjU4ODIsImV4cCI6MjA3MzYwMTg4Mn0.LNbWOfpIqBOH2fOZJn0Fr97fNwu9jJYfg89dYEjk98I'; // عدل

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true }
});

const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const loginForm = document.getElementById('login-form');
const loginStatus = document.getElementById('login-status');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const adminEmailSpan = document.getElementById('admin-email');
// عناصر النماذج الجديدة
const donorForm = document.getElementById('donor-form');
const donorStatus = document.getElementById('donor-status');
const addDonorBtn = document.getElementById('add-donor-btn');
const paymentForm = document.getElementById('payment-form');
const paymentStatus = document.getElementById('payment-status');
const addPaymentBtn = document.getElementById('add-payment-btn');
// الجداول
const donorsTableBody = document.querySelector('#donors-table tbody');
const paymentsTableBody = document.querySelector('#payments-table tbody');
// تبويبات
let tabsBar, donorSection, donorTlSection, paymentSection, tabDonorsBtn, tabDonorsTlBtn, tabPaymentsBtn;
document.addEventListener('DOMContentLoaded', () => {
  tabsBar = document.getElementById('tabs-bar');
  donorSection = document.getElementById('donor-section');
  donorTlSection = document.getElementById('donor-tl-section');
  paymentSection = document.getElementById('payment-section');
  tabDonorsBtn = document.getElementById('tab-donors');
  tabDonorsTlBtn = document.getElementById('tab-donors-tl');
  tabPaymentsBtn = document.getElementById('tab-payments');
  function activate(tab){
    if(!donorSection||!paymentSection) return;
    // إعادة ضبط
    donorSection.classList.remove('active');
    donorTlSection && donorTlSection.classList.remove('active');
    paymentSection.classList.remove('active');
    tabDonorsBtn.classList.remove('active');
    tabDonorsTlBtn && tabDonorsTlBtn.classList.remove('active');
    tabPaymentsBtn.classList.remove('active');
    if(tab==='donors'){ donorSection.classList.add('active'); tabDonorsBtn.classList.add('active'); }
    else if(tab==='donors-tl'){ donorTlSection && donorTlSection.classList.add('active'); tabDonorsTlBtn && tabDonorsTlBtn.classList.add('active'); }
    else { paymentSection.classList.add('active'); tabPaymentsBtn.classList.add('active'); }
    // تمرير لأعلى
    window.scrollTo({top:0,behavior:'smooth'});
  }
  tabDonorsBtn?.addEventListener('click', ()=> activate('donors'));
  tabDonorsTlBtn?.addEventListener('click', ()=> activate('donors-tl'));
  tabPaymentsBtn?.addEventListener('click', ()=> activate('payments'));
});
const donorsTlTableBody = document.querySelector('#donors-tl-table tbody');

async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    // تحقق أنه أدمن
    const isAdmin = await checkIsAdmin();
    if (isAdmin) {
  showAdmin(session.user.email);
  afterLoginLoadData();
  // إظهار شريط التبويبات بعد تسجيل الدخول
  if (tabsBar) tabsBar.style.display = 'flex';
    } else {
      await supabaseClient.auth.signOut();
    }
  }
}

async function checkIsAdmin() {
  const { data, error } = await supabaseClient
    .from('admins')
    .select('user_id')
    .eq('user_id', (await supabaseClient.auth.getUser()).data.user?.id)
    .maybeSingle();
  if (error) {
    console.error(error);
    return false;
  }
  return !!data;
}

function showAdmin(email) {
  loginView.classList.add('hidden');
  adminView.classList.remove('hidden');
  adminEmailSpan.textContent = email;
}

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginStatus.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = '... جار التحقق';
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    loginStatus.textContent = 'فشل الدخول: ' + error.message;
    loginStatus.className = 'status error';
  } else {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      loginStatus.textContent = 'الحساب ليس له صلاحية إدارية';
      loginStatus.className = 'status error';
      await supabaseClient.auth.signOut();
    } else {
      const { data: { user } } = await supabaseClient.auth.getUser();
  showAdmin(user.email);
  afterLoginLoadData();
  if (tabsBar) tabsBar.style.display = 'flex';
    }
  }
  loginBtn.disabled = false;
  loginBtn.textContent = 'تسجيل الدخول';
});

logoutBtn?.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  adminView.classList.add('hidden');
  loginView.classList.remove('hidden');
});

// تحميل آخر السجلات
async function loadDonations() {
  donorsTableBody && (donorsTableBody.innerHTML = '<tr><td colspan="4" style="padding:6px;text-align:center;">... تحميل</td></tr>');
  const { data, error } = await supabaseClient.from('donations').select('*').order('id', { ascending: false }).limit(20);
  if (!donorsTableBody) return;
  if (error) {
    donorsTableBody.innerHTML = `<tr><td colspan="4" style="padding:6px;color:#d32f2f;">خطأ: ${error.message}</td></tr>`;
    return;
  }
  if (!data.length) {
    donorsTableBody.innerHTML = '<tr><td colspan="4" style="padding:6px;text-align:center;">لا يوجد بيانات</td></tr>';
    return;
  }
  donorsTableBody.innerHTML = data.map(row => `
    <tr data-id="${row.id}" data-type="donation">
      <td style="padding:4px 6px;border:1px solid #c2dbe5;">${row.id}</td>
      <td style="padding:4px 6px;border:1px solid #c2dbe5;">${row.donor_name || ''}</td>
      <td style="padding:4px 6px;border:1px solid #c2dbe5;">${row.amount_usd}</td>
      <td style="padding:4px 6px;border:1px solid #c2dbe5;">${new Date(row.created_at).toLocaleDateString('ar-EG')}</td>
      <td style="padding:4px 6px;border:1px solid #c2dbe5;white-space:nowrap;">
        <button class="act-btn edit-donation" style="background:#0288d1;color:#fff;border:none;padding:3px 6px;border-radius:4px;font-size:.65rem;cursor:pointer;">تعديل</button>
        <button class="act-btn del-donation" style="background:#d32f2f;color:#fff;border:none;padding:3px 6px;border-radius:4px;font-size:.65rem;cursor:pointer;">حذف</button>
      </td>
    </tr>`).join('');

}

// تحميل متبرعين الليرة
async function loadDonationsTl() {
  donorsTlTableBody && (donorsTlTableBody.innerHTML = '<tr><td colspan="4" style="padding:6px;text-align:center;">... تحميل</td></tr>');
  const { data, error } = await supabaseClient.from('donations_tl').select('*').order('id', { ascending: false }).limit(20);
  if (!donorsTlTableBody) return;
  if (error) {
    donorsTlTableBody.innerHTML = `<tr><td colspan="4" style="padding:6px;color:#d32f2f;">خطأ: ${error.message}</td></tr>`;
    return;
  }
  if (!data.length) {
    donorsTlTableBody.innerHTML = '<tr><td colspan="4" style="padding:6px;text-align:center;">لا يوجد بيانات</td></tr>';
    return;
  }
  donorsTlTableBody.innerHTML = data.map(row => `
    <tr data-id="${row.id}" data-type="donation-tl">
      <td style="padding:4px 6px;border:1px solid #c2dbe5;">${row.id}</td>
      <td style="padding:4px 6px;border:1px solid #c2dbe5;">${row.donor_name || ''}</td>
      <td style="padding:4px 6px;border:1px solid #c2dbe5;">${row.amount_tl}</td>
      <td style="padding:4px 6px;border:1px solid #c2dbe5;">${new Date(row.created_at).toLocaleDateString('ar-EG')}</td>
      <td style="padding:4px 6px;border:1px solid #c2dbe5;white-space:nowrap;">
        <button class="act-btn edit-donation-tl" style="background:#0288d1;color:#fff;border:none;padding:3px 6px;border-radius:4px;font-size:.65rem;cursor:pointer;">تعديل</button>
        <button class="act-btn del-donation-tl" style="background:#d32f2f;color:#fff;border:none;padding:3px 6px;border-radius:4px;font-size:.65rem;cursor:pointer;">حذف</button>
      </td>
    </tr>`).join('');
}
// نهاية loadDonations

async function loadPayments() {
  paymentsTableBody && (paymentsTableBody.innerHTML = '<tr><td colspan="4" style="padding:6px;text-align:center;">... تحميل</td></tr>');
  const { data, error } = await supabaseClient.from('payment_details').select('*').order('id', { ascending: false }).limit(30);
  if (!paymentsTableBody) return;
  if (error) {
    paymentsTableBody.innerHTML = `<tr><td colspan="4" style="padding:6px;color:#d32f2f;">خطأ: ${error.message}</td></tr>`;
    return;
  }
  if (!data.length) {
    paymentsTableBody.innerHTML = '<tr><td colspan="4" style="padding:6px;text-align:center;">لا يوجد بيانات</td></tr>';
    return;
  }
  paymentsTableBody.innerHTML = data.map(row => `
    <tr data-id="${row.id}" data-type="payment">
      <td style=\"padding:4px 6px;border:1px solid #c2dbe5;\">${row.id}</td>
      <td style=\"padding:4px 6px;border:1px solid #c2dbe5;\">${row.title}</td>
      <td style=\"padding:4px 6px;border:1px solid #c2dbe5;\">${row.entity_name}</td>
      <td style=\"padding:4px 6px;border:1px solid #c2dbe5;\">${row.phone}</td>
      <td style=\"padding:4px 6px;border:1px solid #c2dbe5;white-space:nowrap;\">
        <button class=\"act-btn edit-payment\" style=\"background:#0288d1;color:#fff;border:none;padding:3px 6px;border-radius:4px;font-size:.65rem;cursor:pointer;\">تعديل</button>
        <button class=\"act-btn del-payment\" style=\"background:#d32f2f;color:#fff;border:none;padding:3px 6px;border-radius:4px;font-size:.65rem;cursor:pointer;\">حذف</button>
      </td>
    </tr>`).join('');
}

// التعامل مع أزرار التعديل والحذف (تفويض أحداث)
document.addEventListener('click', async (e) => {
  const target = e.target;
  if (!target || !target.classList) return;
  if (target.classList.contains('edit-donation')) {
    const tr = target.closest('tr');
    if (!tr) return; const id = tr.getAttribute('data-id');
    // جلب البيانات الحالية
    const nameCell = tr.children[1].textContent.trim();
    const amountCell = tr.children[2].textContent.trim();
    const newName = prompt('تعديل اسم المتبرع:', nameCell);
    if (newName === null) return;
    const newAmountStr = prompt('تعديل المبلغ (دولار):', amountCell);
    if (newAmountStr === null) return;
    const newAmount = parseFloat(newAmountStr);
    if (!newName || isNaN(newAmount)) { alert('بيانات غير صالحة'); return; }
    const { error } = await supabaseClient.from('donations').update({ donor_name: newName, amount_usd: newAmount }).eq('id', id);
    if (error) alert('خطأ: ' + error.message); else loadDonations();
  }
  else if (target.classList.contains('del-donation')) {
    const tr = target.closest('tr');
    if (!tr) return; const id = tr.getAttribute('data-id');
    if (!confirm('حذف المتبرع رقم ' + id + '؟')) return;
    const { error } = await supabaseClient.from('donations').delete().eq('id', id);
    if (error) alert('خطأ: ' + error.message); else loadDonations();
  }
  else if (target.classList.contains('edit-donation-tl')) {
    const tr = target.closest('tr');
    if (!tr) return; const id = tr.getAttribute('data-id');
    const nameCell = tr.children[1].textContent.trim();
    const amountCell = tr.children[2].textContent.trim();
    const newName = prompt('تعديل اسم المتبرع (TL):', nameCell);
    if (newName === null) return;
    const newAmountStr = prompt('تعديل المبلغ (TL):', amountCell);
    if (newAmountStr === null) return;
    const newAmount = parseFloat(newAmountStr);
    if (!newName || isNaN(newAmount)) { alert('بيانات غير صالحة'); return; }
    const { error } = await supabaseClient.from('donations_tl').update({ donor_name: newName, amount_tl: newAmount }).eq('id', id);
    if (error) alert('خطأ: ' + error.message); else loadDonationsTl();
  }
  else if (target.classList.contains('del-donation-tl')) {
    const tr = target.closest('tr');
    if (!tr) return; const id = tr.getAttribute('data-id');
    if (!confirm('حذف المتبرع (TL) رقم ' + id + '؟')) return;
    const { error } = await supabaseClient.from('donations_tl').delete().eq('id', id);
    if (error) alert('خطأ: ' + error.message); else loadDonationsTl();
  }
  
  else if (target.classList.contains('edit-payment')) {
    const tr = target.closest('tr');
    if (!tr) return; const id = tr.getAttribute('data-id');
    const titleCell = tr.children[1].textContent.trim();
    const entityCell = tr.children[2].textContent.trim();
    const phoneCell = tr.children[3].textContent.trim();
    const newTitle = prompt('تعديل العنوان:', titleCell); if (newTitle === null) return;
    const newEntity = prompt('تعديل اسم الجهة:', entityCell); if (newEntity === null) return;
    const newPhone = prompt('تعديل الهاتف/الحساب:', phoneCell); if (newPhone === null) return;
    if (!newTitle || !newEntity || !newPhone) { alert('بيانات غير صالحة'); return; }
    const { error } = await supabaseClient.from('payment_details').update({ title: newTitle, entity_name: newEntity, phone: newPhone }).eq('id', id);
    if (error) alert('خطأ: ' + error.message); else loadPayments();
  }
  else if (target.classList.contains('del-payment')) {
    const tr = target.closest('tr');
    if (!tr) return; const id = tr.getAttribute('data-id');
    if (!confirm('حذف الوسيلة رقم ' + id + '؟')) return;
    const { error } = await supabaseClient.from('payment_details').delete().eq('id', id);
    if (error) alert('خطأ: ' + error.message); else loadPayments();
  }
}); // نهاية تفويض الأحداث

// إضافة متبرع بالدولار
donorForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  donorStatus.textContent = '';
  donorStatus.className = 'status';
  addDonorBtn.disabled = true;
  addDonorBtn.textContent = '... جاري الإضافة';
  const donor_name = document.getElementById('donor_name').value.trim();
  const amount_usd = parseFloat(document.getElementById('amount_usd').value || '0');
  if (!donor_name || isNaN(amount_usd)) {
    donorStatus.textContent = 'أدخل اسم المتبرع والمبلغ الصحيح';
    donorStatus.className = 'status error';
    addDonorBtn.disabled = false;
    addDonorBtn.textContent = 'إضافة المتبرع';
    return;
  }
  try {
    const { error } = await supabaseClient.from('donations').insert({ donor_name, amount_usd });
    if (error) throw error;
    donorStatus.textContent = 'تمت الإضافة';
    donorStatus.className = 'status success';
    donorForm.reset();
    loadDonations();
  } catch(err) {
    donorStatus.textContent = 'فشل: ' + (err.message || err);
    donorStatus.className = 'status error';
  } finally {
    addDonorBtn.disabled = false;
    addDonorBtn.textContent = 'إضافة المتبرع';
  }
});

// إضافة متبرع TL
const donorTlForm = document.getElementById('donor-tl-form');
const donorTlStatus = document.getElementById('donor-tl-status');
const addDonorTlBtn = document.getElementById('add-donor-tl-btn');
donorTlForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  donorTlStatus.textContent='';
  donorTlStatus.className='status';
  addDonorTlBtn.disabled=true;
  addDonorTlBtn.textContent='... جاري الإضافة';
  const donor_name = document.getElementById('donor_name_tl').value.trim();
  const amount_tl = parseFloat(document.getElementById('amount_tl').value || '0');
  if(!donor_name || isNaN(amount_tl)){
    donorTlStatus.textContent='أدخل اسم المتبرع والمبلغ الصحيح';
    donorTlStatus.className='status error';
    addDonorTlBtn.disabled=false;
    addDonorTlBtn.textContent='إضافة المتبرع';
    return;
  }
  try {
    const { error } = await supabaseClient.from('donations_tl').insert({ donor_name, amount_tl });
    if(error) throw error;
    donorTlStatus.textContent='تمت الإضافة';
    donorTlStatus.className='status success';
    donorTlForm.reset();
    loadDonationsTl();
  } catch(err){
    donorTlStatus.textContent='فشل: ' + (err.message||err);
    donorTlStatus.className='status error';
  } finally {
    addDonorTlBtn.disabled=false;
    addDonorTlBtn.textContent='إضافة المتبرع';
  }
});

// إضافة وسيلة دفع
paymentForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  paymentStatus.textContent = '';
  paymentStatus.className = 'status';
  addPaymentBtn.disabled = true;
  addPaymentBtn.textContent = '... جاري الإضافة';
  const title = document.getElementById('title').value.trim();
  const entity_name = document.getElementById('entity_name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  if (!title || !entity_name || !phone) {
    paymentStatus.textContent = 'أكمل الحقول';
    paymentStatus.className = 'status error';
    addPaymentBtn.disabled = false;
    addPaymentBtn.textContent = 'إضافة الوسيلة';
    return;
  }
  try {
    const { error } = await supabaseClient.from('payment_details').insert({ title, entity_name, phone });
    if (error) throw error;
    paymentStatus.textContent = 'تمت الإضافة';
    paymentStatus.className = 'status success';
    paymentForm.reset();
    loadPayments();
  } catch(err) {
    paymentStatus.textContent = 'فشل: ' + (err.message || err);
    paymentStatus.className = 'status error';
  } finally {
    addPaymentBtn.disabled = false;
    addPaymentBtn.textContent = 'إضافة الوسيلة';
  }
});

function afterLoginLoadData(){
  loadDonations();
  loadDonationsTl();
  loadPayments();
}

// عند تحميل الصفحة
checkSession();

// ضمان إغلاق جميع الكتل (لا يوجد كود إضافي)
