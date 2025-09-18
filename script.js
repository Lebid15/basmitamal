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
});
