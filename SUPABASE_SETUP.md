# إعداد Supabase لصفحة الإدارة

## 1. إنشاء مشروع
1. ادخل إلى https://supabase.com وسجّل الدخول.
2. أنشئ مشروعًا جديدًا واحصل على: Project URL و anon public key.
3. استخرج أيضًا service_role key (لا تستخدم في الواجهة، فقط للإدارة أو سكربتات خارجية).

## 2. تنفيذ مخطط الجداول والسياسات
افتح SQL Editor داخل لوحة Supabase والصق محتوى الملف `supabase-schema.sql` ثم نفّذه مرة واحدة.

هذا ينشئ الجداول التالية:
- donations (اسم المتبرع + المبلغ)
- payment_details (العنوان + اسم الجهة + رقم الجوال)
- admins (IDs لمستخدمي auth المسموح لهم بالإدخال)
- دالة insert_donation_and_payment للإدراج الذري في الجدولين.

## 3. إضافة حساب إداري
1. من Authentication > Users أضف مستخدمًا (Email/Password).
2. انسخ الـ UUID الخاص بالمستخدم.
3. نفّذ استعلام SQL لإضافته كأدمن:
```sql
insert into public.admins (user_id) values ('USER_UUID_HERE');
```

## 4. وضع مفاتيح Supabase في الواجهة
في الملف `admin.js` عدل:
```js
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';
```
ضع القيم الحقيقية.

## 5. الاختبار
1. افتح `admin.html` في المتصفح.
2. سجّل الدخول بالبريد/كلمة المرور للحساب الإداري.
3. أدخل البيانات واضغط حفظ السجلات.
4. تحقق في جدول donations و payment_details من إضافة السجلين معًا.

## 6. ملاحظات أمان
- مفاتيح anon فقط في المتصفح. لا تضع service_role في الواجهة.
- يمكنك تقييد select لاحقًا بعدم السماح إلا للإدمن حسب الحاجة.
- الدالة تستخدم security definer وتتحقق من أن المستخدم إداري قبل الإدراج.

## 7. تحسينات مستقبلية مقترحة
- عرض سجل آخر التبرعات داخل الصفحة.
- إضافة تعديل/حذف للسجلات.
- دعم رفع ملف إيصال.
- دعم ترجمة/لغتين.

بالتوفيق.
