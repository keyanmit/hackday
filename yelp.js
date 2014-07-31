
window.yelp = new function(){

	var self = this;
	var consumerKey = "ngsuqGocVjRAXyQjsYCGcg";
	var consumerSec = "9irWfuHkbMamnZkCektnYpWsZy4";

	var oauth = OAuth({
    consumer: {
        public: consumerKey,
        secret: consumerSec
    },
    signature_method: 'HMAC-SHA1'
	});

};