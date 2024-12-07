'use strict';
// @ts-ignore
const stripe = require("stripe")(process.env.STRIPE_KEY);
// @ts-ignore
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({ strapi }) => ({
    async create(ctx) {
        try {
            const { products } = ctx.request.body.data;
            
            // Log full products data for debugging

            
            // Improved line items processing
            const lineItems = products.map((product) => {
                let imageUrl = 'https://your-default-image-url.com/default-image.jpg';
            
                // Log all relevant image-related fields
                // console.log('Product Image Fields:', {
                //     image1: product.img,
                //     image: product.img,
                //     images: product.img,
                //     productId: product.id,
                //     img: product.img,
                // });
            
                // Extract image URL from 'img' field
                if (product.img) {
                    imageUrl = product.img.startsWith('http')
                        ? product.img
                        : `${process.env.STRAPI_BASE_URL}${product.img}`;
                }
            
                // console.log('Product Image Processing:', {
                //     productTitle: product.name || product.title,
                //     resolvedImageUrl: imageUrl,
                // });
            
                const description = product.description && product.description.trim()
                    ? product.description
                    : `Description for ${product.name || product.title}`;
            
                return {
                    price_data: {
                        currency: 'PKR',
                        product_data: {
                            name: product.name || product.title || 'Unnamed Product',
                            description: description,
                            images: [imageUrl],
                        },
                        unit_amount: Math.round(product.price * 100),
                    },
                    quantity: product.quantity || 1,
                };
            });
            
            // Create Stripe session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                shipping_address_collection: { allowed_countries: ['US', 'CA', 'PK'] },
                phone_number_collection: { enabled: true },
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
            console.error('Detailed error:', error.toString());
            ctx.response.status = 500;
            return { error: { message: error.message || 'An error occurred during checkout' } };
        }
    },
}));