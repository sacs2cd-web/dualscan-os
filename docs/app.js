'use strict';
const tour = [
 {label:'The desktop',title:'Everything starts here.',image:'home.jpg',path:['Desktop'],description:'The familiar Galaxy home screen, with five core OEM apps kept visible in the dock.',details:['Typelocker Gmail → USPS Money → USPS Banking → USPS® Wallet → VisaUSD™.','Keep this designated order in redistributed derivatives.']},
 {label:'The app library',title:'Meet the ecosystem.',image:'apps.jpg',path:['Desktop','App library'],description:'Open the app library to find wallets, Typelocker tools, Dualscan Chat, Diamond Player and Share Lite.',details:['Your apps remain individually accessible.','Pictured third-party services keep their own accounts and terms.']},
 {label:'USPS® Wallet',title:'A wallet of its own.',image:'wallet.jpg',path:['Desktop','App library','USPS® Wallet'],description:'The separate USPS® Wallet app shows its account overview and Scan, Receive and Send actions.',details:['This is distinct from the USPS Money app.','The screenshot hides balances and shows the supplied wallet presentation.']},
 {label:'Biometric unlock',title:'Open with a touch.',image:'biometric.jpg',path:['Desktop','App library','USPS Money','Unlock'],description:'Native Android biometrics open the local wallet. The original wallet PIN remains available as a fallback.',details:['Enrollment is optional for wallet unlock.','Pay → Send separately requires a fresh biometric confirmation.']},
 {label:'USPS Money',title:'Your everyday wallet.',image:'usps-money.jpg',path:['Desktop','App library','USPS Money'],description:'The local USPS Money interface brings Pay, Receive, supported assets and wallet personalization into one place.',details:['PIN and optional native biometric unlock.','Retail Code, Typelocker Cypher recovery and Sypher URL scanning.']},
 {label:'Retail Code',title:'Your code, in the wallet.',image:'retail.jpg',path:['Desktop','App library','USPS Money','Retail Code'],description:'Open the wallet panel for Retail Code access, address controls, PIN settings and the biometric-unlock switch.',details:['The supplied screenshot shows a timed Retail Code.','Authentication and local wallet controls stay in the app.']},
 {label:'Scan & pay',title:'Bring a code into view.',image:'scanner.jpg',path:['Desktop','App library','USPS Money','Pay / Scan'],description:'The camera scanner sits inside the payment flow, with the Bishiki mascot overlay and focus controls.',details:['Typelocker™ Sypher™ is for ordinary in-app URL scans.','Typelocker™ Cypher remains exclusive to recovery scanning.']},
 {label:'Gaming Credits',title:'Tap into the community.',image:'gaming.jpg',path:['Desktop','App library','VisaUSD™','Gaming Credits'],description:'VisaUSD’s Gaming Credits panel supports whole-credit NFC transfers between compatible devices.',details:['20,580 credits each day, resetting at 9am New York.','Gaming Credits are separate from cryptocurrency payments.']},
 {label:'Community manual',title:'The rulebook is built in.',image:'manual.jpg',path:['Desktop','App library','VisaUSD™','Gaming Credits','Manual'],description:'Select the U.S. Gamer icon to open the packaged Community Manual inside the app.',details:['59 pages with zoom and navigation.','Return with Android Back or the viewer’s back control.']},
 {label:'Wallpaper library',title:'191+ ways to make it yours.',image:'gallery.jpg',path:['Desktop','App library','Gallery','Wallpapers'],description:'Browse the Dualscan Wallpaper Library in Gallery and choose the artwork for your home or lock screen.',details:['191+ wallpapers in the Dualscan library, as supplied by Dualscan LLC.','Open an image, then choose Set as wallpaper from its menu.']},
 {label:'Your personal desktop',title:'Back home. Your way.',image:'wallpaper-home.jpg',path:['Desktop','Customized desktop'],description:'A different backdrop, the same accessible core. Customize the workspace while keeping the five designated dock apps in place.',details:['Personalize your wallpaper and additional app placement.','Derivative editions retain the protected OEM components and notices.']}
];
let active=0;
const $=id=>document.getElementById(id);
const steps=$('tourSteps');
tour.forEach((step,index)=>{const li=document.createElement('li'),button=document.createElement('button'),n=document.createElement('span');n.textContent=String(index+1).padStart(2,'0');button.append(n,document.createTextNode(step.label));button.type='button';button.addEventListener('click',()=>showStep(index));li.append(button);steps.append(li);});
function showStep(index){
 active=index;const step=tour[index];
 steps.querySelectorAll('button').forEach((button,i)=>{if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
 $('tourImage').src='assets/'+step.image;$('tourImage').alt=step.description;
 $('tourTitle').textContent=step.title;$('tourKicker').textContent=step.label.toUpperCase();$('tourDescription').textContent=step.description;
 const ul=document.createElement('ul');step.details.forEach(text=>{const li=document.createElement('li');li.textContent=text;ul.append(li);});$('tourDetail').replaceChildren(ul);
 $('tourCount').textContent=String(index+1).padStart(2,'0')+' / '+tour.length;
 $('tourPrev').disabled=index===0;$('tourNext').disabled=index===tour.length-1;
 $('tourBreadcrumb').replaceChildren();step.path.forEach((text,i)=>{if(i){const sep=document.createElement('span');sep.textContent='/';sep.setAttribute('aria-hidden','true');$('tourBreadcrumb').append(sep);}if(i===0&&index>0){const b=document.createElement('button');b.textContent=text;b.addEventListener('click',()=>showStep(0));$('tourBreadcrumb').append(b);}else{const span=document.createElement('span');span.textContent=text;$('tourBreadcrumb').append(span);}});
}
$('tourPrev').addEventListener('click',()=>{if(active>0)showStep(active-1);});
$('tourNext').addEventListener('click',()=>{if(active<tour.length-1)showStep(active+1);});
document.querySelectorAll('[data-tour-target]').forEach(button=>button.addEventListener('click',()=>{showStep(Number(button.dataset.tourTarget));$('tour').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}));
const dialog=$('screenDialog');
$('expandScreen').addEventListener('click',()=>{const step=tour[active];$('dialogImage').src='assets/'+step.image;$('dialogImage').alt=step.description;$('dialogCaption').textContent=step.path.join(' / ')+' — '+step.title;dialog.showModal();});
$('closeScreen').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
showStep(0);
