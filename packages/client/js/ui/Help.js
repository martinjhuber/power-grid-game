export class Help {
  #overlay;
  #closeBtn;

  constructor({ overlay, closeBtn }) {
    this.#overlay = overlay;
    this.#closeBtn = closeBtn;

    this.#closeBtn.addEventListener('click', () => this.close());
    this.#overlay.addEventListener('click', (event) => {
      if (event.target === this.#overlay) {
        this.close();
      }
    });
  }

  open() {
    this.#overlay.hidden = false;
  }

  close() {
    this.#overlay.hidden = true;
  }
}
