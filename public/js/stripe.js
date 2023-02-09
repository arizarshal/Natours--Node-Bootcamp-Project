import axios from 'axios'
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51MXSVuSAele60dborGZlh055UOQaqDBhgrc34T52KVDpmHjlCd76gHp3KeBaS5s6r7nGuMGdjr8LsKZKr66ZeO3A00ekRo0dpA');


export const bookTour =  async tourId => {
    try {
        // 1) Get checkout session from API
        const session = await axios(`http://127.0.0.1:3000/api/v1/booking/checkout-session/${tourId}`)
        console.log(session)
    
        // 2) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })

    } catch(err) {
        console.log(err)
        showAlert('error', err)
    }
}