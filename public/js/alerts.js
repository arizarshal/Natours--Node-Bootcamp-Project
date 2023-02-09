// type: success or error

export const hideAlert = () => {
    const el = document.querySelector('.alert');
    if (el) el.parentElement.removeChild(el); 
}

// type is 'success' or 'error'
export const showAlert = (type, msg) => {
    hideAlert()   // close all current alerts
    const markup = `<div class="alert alert--${type}">${msg}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
    // hide alerts after 5 sec
    window.setTimeout(hideAlert, 5000)
}