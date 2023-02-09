const express = require('express');
const bookingController = require('../controllers/bookingController')
const authController = require('./../controllers/authController')

const router = express.Router()

const CSP = 'Content-Security-Policy';
const POLICY =
  "default-src 'self' https://*.mapbox.com ;" +
  "base-uri 'self';block-all-mixed-content;" +
  "font-src 'self' https: data:;" +
  "frame-ancestors 'self';" +
  "img-src http://localhost:8000 'self' blob: data:;" +
  "object-src 'none';" +
  "script-src https: cdn.jsdelivr.net cdnjs.cloudflare.com api.mapbox.com 'self' blob: ;" +
  "script-src-attr 'none';" +
  "style-src 'self' https: 'unsafe-inline';" +
  'upgrade-insecure-requests;';


router.use((req, res, next) => {
    res.setHeader(CSP, POLICY);
    next();
  });


router.use(authController.protect)

router.get('/checkout-session/:tourId', 
    bookingController.getCheckoutSession)

router.use(authController.restrictTo('admin', 'lead-guide'))

router.route('')
    .get(bookingController.getAllBooking)
    .post(bookingController.createBooking)

router.route(':id')
    .get(bookingController.getBooking)
    .patch(bookingController.updateBooking)
    .delete(bookingController.deleteBooking)

module.exports = router