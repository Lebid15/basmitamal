let currentSlide = 0;
const slides = document.querySelectorAll('.slide');

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === index) slide.classList.add('active');
    });
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
}

// Auto-slide every 4 seconds
setInterval(nextSlide, 4000);

document.addEventListener('DOMContentLoaded', () => {
    showSlide(currentSlide);

    // Chat bar interactions
    const chatMoreBtn = document.getElementById('chat-more-btn');
    const chatMenu = document.getElementById('chat-menu');
    const chatAddBtn = document.getElementById('chat-add-btn');

    function closeChatMenuOnOutside(e){
        if(!chatMenu) return;
        const within = chatMenu.contains(e.target) || chatMoreBtn.contains(e.target);
        if(!within) { chatMenu.classList.remove('open'); document.removeEventListener('click', closeChatMenuOnOutside); }
    }

    chatMoreBtn && chatMoreBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        chatMenu?.classList.toggle('open');
        if(chatMenu?.classList.contains('open')){
            document.addEventListener('click', closeChatMenuOnOutside);
        }
    });

    chatMenu && chatMenu.addEventListener('click', (e)=>{
        const target = e.target.closest('.menu-item');
        if(!target) return;
        const action = target.getAttribute('data-action');
        if(action === 'profile'){
            alert('بروفايلي');
        } else if(action === 'matches'){
            alert('مطابقاتي');
        } else if(action === 'logout'){
            alert('تسجيل الخروج');
        }
        chatMenu.classList.remove('open');
    });

    // Users modal for + button (demo list)
    chatAddBtn && chatAddBtn.addEventListener('click', ()=>{
        const users = [
            {id:1, name:'ali'},
            {id:2, name:'sara'},
            {id:3, name:'mohammad'}
        ];
        const backdrop=document.createElement('div');backdrop.className='modal-backdrop';
        const modal=document.createElement('div');modal.className='modal';
        modal.innerHTML = `
            <h3>ابدأ محادثة جديدة</h3>
            <ul class="list">
                ${users.map(u=>`<li><span>${u.name}</span><button class="icon-btn" data-user="${u.id}" title="إضافة">+</button></li>`).join('')}
            </ul>
            <button class="close-btn">إغلاق</button>
        `;
        backdrop.appendChild(modal);document.body.appendChild(backdrop);
        backdrop.addEventListener('click',e=>{if(e.target===backdrop) backdrop.remove();});
        modal.querySelector('.close-btn').addEventListener('click',()=>backdrop.remove());
        modal.querySelector('.list').addEventListener('click',(e)=>{
            const btn = e.target.closest('button.icon-btn');
            if(!btn) return;
            const userId = btn.getAttribute('data-user');
            alert('إضافة/مطابقة مع المستخدم رقم ' + userId);
        });
    });

    // Populate chat list and selection behavior
    const chatList = document.getElementById('chat-list');
    const chatContent = document.getElementById('chat-content');
    const layout = document.querySelector('.chat-layout');
    if(chatList && chatContent){
        const chats = [
            {id: 101, name: 'lebid', currency: 'TL', amount: 100, time: '03:39 AM'},
            {id: 102, name: 'ali', currency: '$', amount: 20, time: '07:20 PM'}
        ];
        chatList.innerHTML = chats.map(c=>`<li data-id="${c.id}"><div><div style="font-weight:700;">${c.name}</div><div class="meta">${c.time} — مطابقة: ${c.currency} ${c.amount.toFixed(2)}</div></div><div><span class="icon-btn" title="فتح">›</span></div></li>`).join('');

        chatList.addEventListener('click', (e)=>{
            const li = e.target.closest('li');
            if(!li) return;
            const id = li.getAttribute('data-id');
            // Load messages for this chat id (placeholder)
            chatContent.innerHTML = `<div style="padding:16px;">
                <div style="opacity:.7;margin-bottom:8px;">المحادثة #${id}</div>
                <div>رسالة 1 ...</div>
                <div>رسالة 2 ...</div>
            </div>`;
            // On mobile, toggle to content view
            if(window.matchMedia('(max-width: 768px)').matches){
                layout?.classList.add('show-content');
            }
        });
    }
});

// Optional: back button handler if you add one later
function backToList(){
  const layout = document.querySelector('.chat-layout');
  layout?.classList.remove('show-content');
}
