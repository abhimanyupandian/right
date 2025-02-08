<script>
    import { onMount } from "svelte";

    let texts = ["Reading", "Writing"];
    let currentText = "";
    let currentIndex = 0;
    let typingSpeed = 100; // Typing speed in ms
    let delayBetween = 1000; // Time before switching words
    let isDeleting = false;
    let charIndex = 0;

    function typeEffect() {
        let fullText = texts[currentIndex];

        if (!isDeleting) {
            currentText = fullText.substring(0, charIndex + 1);
            charIndex++;
            if (charIndex === fullText.length) {
                isDeleting = true;
                setTimeout(typeEffect, delayBetween);
                return;
            }
        } else {
            currentText = fullText.substring(0, charIndex - 1);
            charIndex--;
            if (charIndex === 0) {
                isDeleting = false;
                currentIndex = (currentIndex + 1) % texts.length;
            }
        }

        setTimeout(typeEffect, isDeleting ? typingSpeed / 2 : typingSpeed / 2);
    }

    onMount(typeEffect);
</script>

<span>{currentText}</span>

<style>
    .typewriter {
        font-size: 2rem;
        font-family: monospace;
        border-right: 3px solid black;
        display: inline-block;
        padding-right: 5px;
    }
</style>
