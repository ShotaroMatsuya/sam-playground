const axios = require('axios');
const aws = require('aws-sdk');
const sns = new aws.SNS();
const news_api_endpoint = process.env.API_ENDPOINT;

const jsdom = require('jsdom');
const dom =
  new jsdom.JSDOM(`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
 <html lang="en">
 
 
 <body>
   <div class="container", style="min-height: 40vh;
   padding: 0 0.5rem;
   display: flex;
   flex-direction: column;
   justify-content: center;
   align-items: center;"> 
    
       <br>
       </div>
       
      
       <div class="footer-links" style="display: flex;justify-content: center;align-items: center;">
         <a href="/" style="text-decoration: none;margin: 8px;color: #9CA3AF;">Unsubscribe?</a>
         <a href="/" style="text-decoration: none;margin: 8px;color: #9CA3AF;">About Us</a>
      
       </div>
       </div>
   
         </div>
        
 </body>
 </html>`);

const publishToSNS = message =>
  sns
    .publish({
      Message: message,
      TopicArn: process.env.SNS_TOPIC_ARN,
    })
    .promise();

const createEmailHTML = news => {
  let alllNews = news.Items.map(function (item) {
    return `
     <div class="card" style="margin-left: 20px;margin-right: 20px;">
                 <div style="font-size: 14px;">
                 <div class='card' style=" background: #f0c5c5;
                 border-radius: 5px;
                 padding: 1.75rem;
                 font-size: 1.1rem;
                 font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
                   DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;">
             
               <p>${item.title}</p>
               <blockquote>by ${item.description}</blockquote>
               <blockquote>by ${item.sentiment}</blockquote>
               <blockquote>by ${item.content}</blockquote>
               <blockquote>by ${item.newsUrl}</blockquote>
               <blockquote>by ${item.timestamp}</blockquote>
             
           </div>
 
 `;
  });
  dom.window.document.querySelector('.container').innerHTML =
    alllNews.join('\n');
  //dom.window.document.querySelector("p").textContent; // 'Hello world'

  return dom;
};

const buildEmailBody = news => {
  var content;
  var title;
  var description;
  var sentiment;
  var email = 'paulo@me.com';
  for (const item of news.Items) {
    description = item['description'];
    headline = item['title'];
    content = item['content'];
    sentiment = item['sentiment'];
    url = item['newsUrl'];
  }
  return `
          Message: ${headline}
          Sentiment: ${sentiment} 
          Description: ${description} 
          Content: ${content}
          Url: ${url}
          Email: ${email}
         
       `;
};
exports.scheduledEventLoggerHandler = async (event, context) => {
  const news = await getNews();

  console.log('EVENT::', event);
  //const data = JSON.parse(event.body);
  const emailBody = buildEmailBody(news);
  //const emailBody = createEmailHTML(news);

  await publishToSNS(emailBody);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': false, // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify({ message: 'OK' }),
  };
  //console.log("Calling Scheduler....", news);
  // All log statements are written to CloudWatch by default. For more information, see
  // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-logging.html
  //console.info(JSON.stringify(event));
  //console.info(JSON.stringify(news));
};

const getNews = async () => {
  const news = await axios.get(news_api_endpoint);
  return news.data;
};
