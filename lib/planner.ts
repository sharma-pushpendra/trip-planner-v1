import { TripRequest, TravelRecommendation, ItineraryDay, TripResult, ResearchSource } from './models';
export function plan(request:TripRequest,recs:TravelRecommendation[],sources:ResearchSource[]=[]):ItineraryDay[]{
 const count=Math.min(30,Math.round((Date.parse(request.returnDate)-Date.parse(request.departure))/86400000)+1);
 const pool=recs.filter(r=>r.category==='Attractions'||r.category==='Food').sort((a,b)=>(a.location||'').localeCompare(b.location||''));
 const used=new Set<string>();let spent=0;
 const costFor=(r:TravelRecommendation)=>{
  if(r.price===null||r.currency!==request.currency)return null;
  if(r.label==='illustrative')return r.price;
  const basis=(r.priceBasis||'').toLowerCase().trim();
  if(['per person','per adult','per ticket'].includes(basis))return r.price*request.travelers;
  if(['total for group','total for all travelers'].includes(basis))return r.price;
  return null;
 };
 return Array.from({length:count},(_,i)=>{
  const date=new Date(Date.parse(request.departure)+i*86400000).toISOString().slice(0,10);
  const weekday=new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'long',timeZone:'UTC'}).toLowerCase();
  const selected:ItineraryDay['activities']=[];
  for(const period of ['Morning','Afternoon','Evening'] as const){
   const candidates=pool.filter(r=>!used.has(r.id)).sort((a,b)=>period==='Evening'?Number(b.category==='Food')-Number(a.category==='Food'):Number(a.category==='Food')-Number(b.category==='Food'));
   const rec=candidates.find(r=>{
    const hours=sources.find(s=>s.id===r.sourceId)?.openingHours?.toLowerCase()||'';
    if(new RegExp('closed(?: on)? '+weekday).test(hours))return false;
    const cost=costFor(r);return cost===null||spent+cost<=request.budget;
   });
   if(!rec)continue;used.add(rec.id);const cost=costFor(rec);spent+=cost||0;
   const source=sources.find(s=>s.id===rec.sourceId);
   selected.push({id:crypto.randomUUID(),recommendationId:rec.id,name:rec.name,notes:rec.notes+(source?.openingHours?' Reported hours: '+source.openingHours+'. Confirm this suggested time fits.':''),period,cost,done:false});
  }
  return {date,activities:selected};
 });
}
export function demo(request:TripRequest):TripResult{
 const rows:[string,TravelRecommendation['category'],string,number,string][]=[['Amber Fort','Attractions','Amber',600,'Explore the courtyards and hilltop views. Allow 2–3 hours; verify ticket rules before visiting.'],['Panna Meena ka Kund','Attractions','Amber',0,'A quiet architectural stop near Amber. Respect local access restrictions.'],['Hawa Mahal','Attractions','Old City',400,'Take in the honeycomb façade. Allow about an hour.'],['City Palace','Attractions','Old City',1200,'A slower afternoon of royal courtyards and craftsmanship.'],['Jantar Mantar','Attractions','Old City',400,'Discover the astronomical instruments. Allow 1–2 hours.'],['Johari Bazaar walk','Attractions','Old City',0,'Browse textiles and jewelry; shopping is not included.'],['Nahargarh Fort','Attractions','North Jaipur',400,'Leave room for hilltop views. Confirm access and transport beforehand.'],['Rajasthani thali at LMB','Food','Old City',1400,'An illustrative meal stop for two. Ask about ingredients and dietary needs.'],['Masala Chowk food walk','Food','Ram Niwas Garden',800,'Sample local dishes at your own pace. Illustrative food allowance for two.'],['Heritage boutique stay','Accommodation','Central Jaipur',7000,'Illustrative two-night room allowance, not a named property or booking offer.'],['Delhi–Jaipur rail + local rides','Transportation','New Delhi → Jaipur',5000,'Illustrative group transport allowance; schedules and fares are not verified.']];
 const recs:TravelRecommendation[]=rows.map((r,i)=>({id:`demo-${i}`,name:r[0],category:r[1],location:r[2],price:request.currency==='INR'?r[3]:null,currency:request.currency==='INR'?'INR':null,priceBasis:'Illustrative total for two travelers',duration:r[1]==='Attractions'?'1–3 hours (suggested)':null,sourceId:null,label:'illustrative',notes:r[4]}));
 const req={...request,destination:'Jaipur',choose:false};return {id:crypto.randomUUID(),mode:'demo',request:req,recommendations:recs,sources:[],reports:[],days:plan(req,recs),createdAt:new Date().toISOString()};
}
