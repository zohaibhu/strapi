'use strict';

// @ts-ignore
const stripe = require("stripe")(process.env.STRIPE_KEY);
// @ts-ignore
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({ strapi }) => ({
    async create(ctx) {
        try {

            // sending the data request into the body
            const { products } = ctx.request.body.data;
         
            // Create line items for Stripe
            const lineItems = products.map((product) => {
                // Check if product.image exists; if not, set a default image or handle the absence
                // const imageUrl = product.image && product.image.startsWith('http')
                //     ? product.image  // Use the full URL if it’s already there
                //     : product.image  // If it's defined, prepend STRAPI_BASE_URL
                //     ? `${process.env.STRAPI_BASE_URL}${product.image}` 
                //     : 'https://your-default-image-url.com/default-image.jpg';  // Use a default image if none is provided
            
                return {
                    price_data: {
                        currency: 'PKR',
                        product_data: {
                            name: product.title,
                            description: product.description,
                            // images: [imageUrl],  // Use the processed image URL here
                        },
                        unit_amount: product.price * 100, // Price in the smallest unit
                    },
                    quantity: product.quantity,
                };
            });
            
            // Create Stripe session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                shipping_address_collection: { allowed_countries: ['US', 'CA', 'PK'] },
                phone_number_collection : {enabled: true},
                line_items: lineItems,
                success_url: `${process.env.CLIENT_URL}?success=true`,
                cancel_url: `${process.env.CLIENT_URL}?success=false`,
            });

            // Create order in Strapi
            await strapi.service('api::order.order').create({
                data: {
                    products,
                    stripeId: session.id,
                    total: products.reduce((sum, product) => 
                        sum + (product.price * product.quantity), 0),
                    status: 'pending'
                },
            });

            // Return only the sessionId
            ctx.send({ stripeSessionId: session.id });

        } catch (error) {
            console.error('Order creation error:', error);
            ctx.response.status = 500;
            return { error: { message: error.message || 'An error occurred during checkout' } };
        }
    },
}));
