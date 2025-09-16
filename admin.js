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
const combinedForm = document.getElementById('combined-form');
const saveStatus = document.getElementById('save-status');
const saveBtn = document.getElementById('save-btn');

async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    // تحقق أنه أدمن
    const isAdmin = await checkIsAdmin();
    if (isAdmin) {
      showAdmin(session.user.email);
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

combinedForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  saveStatus.textContent = '';
  saveStatus.className = 'status';
  saveBtn.disabled = true;
  saveBtn.textContent = '... جار الحفظ';

  const donor_name = document.getElementById('donor_name').value.trim();
  const amount_usd = parseFloat(document.getElementById('amount_usd').value || '0');
  const title = document.getElementById('title').value.trim();
  const entity_name = document.getElementById('entity_name').value.trim();
  const phone = document.getElementById('phone').value.trim();

  if (!donor_name || !title || !entity_name || !phone || isNaN(amount_usd)) {
    saveStatus.textContent = 'الرجاء تعبئة جميع الحقول بشكل صحيح';
    saveStatus.className = 'status error';
    saveBtn.disabled = false;
    saveBtn.textContent = 'حفظ السجلات';
    return;
  }

  try {
    const { error } = await supabaseClient
      .rpc('insert_donation_and_payment', {
        p_donor_name: donor_name,
        p_amount_usd: amount_usd,
        p_title: title,
        p_entity_name: entity_name,
        p_phone: phone
      });
    if (error) throw error;
    saveStatus.textContent = 'تم الحفظ بنجاح';
    saveStatus.className = 'status success';
    combinedForm.reset();
  } catch (err) {
    console.error(err);
    saveStatus.textContent = 'فشل الحفظ: ' + (err.message || err);
    saveStatus.className = 'status error';
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'حفظ السجلات';
  }
});

// عند تحميل الصفحة
checkSession();
