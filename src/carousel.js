const CAROUSEL_ELEMENT = 8;
let scroll = null;

let mouseX = 0;
let autoScroll = null;

const carousel = document.getElementById("carousel");
const width = window.innerWidth * window.devicePixelRatio;

carousel.addEventListener("mousemove", (e) => {
    const rect = carousel.getBoundingClientRect();
    mouseX = e.clientX - rect.left;

});

carousel.addEventListener("mouseenter", (e) => {
    if (autoScroll) return;

    autoScroll = setInterval(() => {
        const width = carousel.offsetWidth;

        const leftZone = width * 0.30;
        const rightZone = width * 0.70;

        if (mouseX < leftZone) {
            carousel.scrollLeft -= 10;
        }
        else if (mouseX > rightZone) {
            carousel.scrollLeft += 10;
        }

    }, 16);
});

carousel.addEventListener("mouseleave", () => {
    clearInterval(autoScroll);
    autoScroll = null;
});


const getCarouselElements = () => {
    let pictures = [];

    for (let i=0; i<CAROUSEL_ELEMENT; i++) {
        const picture = document.getElementById(`photo-${i}`);
        pictures = [...pictures, picture];
    };

    return pictures;
}

const scrollPictures = (carouselElement, k) => {

    let counter = 0;
    const maxCounter = carouselElement.dataset.count;
    
    scroll = setInterval(() => 
    {
        carouselElement.src = `./public/assets/img/carousel_${k}/${counter}.jpg`;
        counter = (counter + 1) % maxCounter;
        
    }, 300);
}

const reinitializeCarousel = (carouselElement, k) => {
    clearInterval(scroll);
    carouselElement.removeEventListener("mouseover", scrollPictures, false);
    carouselElement.src = `./public/assets/img/carousel_${k}/${0}.jpg`;
};

getCarouselElements().forEach((carouselElement, k) => {
    carouselElement.addEventListener("mouseover", () => {scrollPictures(carouselElement, k)}, false);
    carouselElement.addEventListener("mouseout", () => {reinitializeCarousel(carouselElement, k)}, false);
});