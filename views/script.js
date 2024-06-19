//funções responsáveis pelo carrossel

// Mostra próximo slide
function showNextSlide(carouselId) {
    var carousel = document.getElementById(carouselId);
    var activeSlide = carousel.querySelector('.slide.active');
    var nextSlide = activeSlide.nextElementSibling;
    if (!nextSlide) {
        nextSlide = carousel.firstElementChild;
    }
    activeSlide.classList.remove('active');
    nextSlide.classList.add('active');
}
//define segundos dos slides
setInterval(function() {
    showNextSlide('carousel1');
}, 8000); 

setInterval(function() {
    showNextSlide('carousel2');
}, 8000); 

setInterval(function() {
    showNextSlide('carousel3');
}, 8000); 

//função responsável pelo botão de copiar
function copyToClipboard() {
    const textToCopy = document.getElementById("myText").innerText;
    navigator.clipboard.writeText(textToCopy);
    alert("Dados da doação copiados: " + textToCopy);
}

   // Carrega a API do YouTube
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    var player;

    // Função chamada quando a API do YouTube é carregada
    function onYouTubeIframeAPIReady() {
        player = new YT.Player('player', {
            height: '360', 
            width: '640', 
            videoId: 'b_N3rSNg6HQ', 
            playerVars: {
                'autoplay': 1, 
                'controls': 1, 
                'rel': 0, 
                'showinfo': 0 
            }
        });
    }

