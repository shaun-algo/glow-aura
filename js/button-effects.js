(() => {
  function startFeedback(button) {
    if (!button || button.classList.contains("busy")) return;

    button.classList.add("busy", "loading");
    const duration = Number(button.dataset.buttonDuration || 900);

    window.setTimeout(() => {
      if (!button.isConnected) return;
      button.classList.remove("loading");
      button.classList.add("done");
      window.setTimeout(() => {
        if (!button.isConnected) return;
        button.classList.remove("done", "busy");
      }, 1600);
    }, duration);
  }

  document.addEventListener("click", event => {
    const button = event.target.closest("[data-button-feedback]");
    if (!button || button.closest("[data-button-form]")) return;
    startFeedback(button);
  });

  const feedbackForm = document.querySelector("[data-button-form]");
  if (feedbackForm) {
    const button = feedbackForm.querySelector("[data-button-feedback]");
    feedbackForm.addEventListener("submit", event => {
      event.preventDefault();
      if (!button || button.classList.contains("busy")) return;
      startFeedback(button);
      window.setTimeout(() => feedbackForm.reset(), Number(button.dataset.buttonDuration || 900));
    });
  }
})();
