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

async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    // تحقق أنه أدمن
    const isAdmin = await checkIsAdmin();
    if (isAdmin) {
  showAdmin(session.user.email);
  afterLoginLoadData();
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
    <tr>
      <td style="padding:4px 6px;border:1px solid #c2dbe5;">${row.id}</td>
      <td style="padding:4px 6px;border:1px solid #c2dbe5;">${row.donor_name || ''}</td>
      <td style="padding:4px 6px;border:1px solid #c2dbe5;">${row.amount_usd}</td>
      <td style="padding:4px 6px;border:1px solid #c2dbe5;">${new Date(row.created_at).toLocaleDateString('ar-EG')}</td>
    </tr>`).join('');
}

async function loadPayments() {
  paymentsTableBody && (paymentsTableBody.innerHTML = '<tr><td colspan="5" style="padding:6px;text-align:center;">... تحميل</td></tr>');
  const { data, error } = await supabaseClient.from('payment_details').select('*').order('id', { ascending: false }).limit(30);
  if (!paymentsTableBody) return;
  if (error) {
    paymentsTableBody.innerHTML = `<tr><td colspan="5" style="padding:6px;color:#d32f2f;">خطأ: ${error.message}</td></tr>`;
    return;
  }
  if (!data.length) {
    paymentsTableBody.innerHTML = '<tr><td colspan="5" style="padding:6px;text-align:center;">لا يوجد بيانات</td></tr>';
    return;
  }
  paymentsTableBody.innerHTML = data.map(row => `
    <tr>
      <td style=\"padding:4px 6px;border:1px solid #c2dbe5;\">${row.id}</td>
      <td style=\"padding:4px 6px;border:1px solid #c2dbe5;\">${row.title}</td>
      <td style=\"padding:4px 6px;border:1px solid #c2dbe5;\">${row.entity_name}</td>
      <td style=\"padding:4px 6px;border:1px solid #c2dbe5;\">${row.phone}</td>
      <td style=\"padding:4px 6px;border:1px solid #c2dbe5;\">${new Date(row.created_at).toLocaleDateString('ar-EG')}</td>
    </tr>`).join('');
}

// إضافة متبرع
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
  loadPayments();
}

// عند تحميل الصفحة
checkSession();
