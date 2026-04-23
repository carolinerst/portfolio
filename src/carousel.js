const CAROUSEL_ELEMENT = 8;
let scroll = null;


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