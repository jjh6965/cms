import{b as z,u as L,r as m,h as M,j as e,c as O,d as R}from"./index-NQW_x_Sn.js";import{e as h}from"./errorMsgPopup-CX9GGfgq.js";import{s as B}from"./TableSearch.module-DFltd_EQ.js";const k=(n,p)=>{const o=p>0?n/p:0;return o===0?"#f28c82":o===1?"#a3bffa":`linear-gradient(to right, #f28c82 ${(1-o)*100}%, #a3bffa ${o*100}%)`},U={"1인실":{color:"#a3bffa"},"2인실":{color:"#f7b267"},"4인실":{color:"#a3bffa"},"8인실":{color:"#f28c82"}},Y=n=>n.includes("#f28c82")&&n.indexOf("#a3bffa")<0?"#fff":"#1e293b",$=()=>{const{user:n}=z(),p=L(),[o,T]=m.useState([]),[I,j]=m.useState(!0),[f,u]=m.useState([]),[w,A]=m.useState([]);m.useEffect(()=>{(!n||!M(n.auth,"reservationView"))&&(console.log("사용자 또는 예약 조회 권한이 없어 리다이렉트합니다."),p("/"))},[n,p]);const D=async()=>{j(!0);try{const t=await O.post(R.getServerUrl("reservation/layout/list"),{FLOOR_ID:"",SECTION:"",DEBUG:"F"});if(t.data.success&&Array.isArray(t.data.data)){A(t.data.data);const r=[...new Set(t.data.data.map(a=>a.FLOOR_ID))].sort((a,l)=>{const x=parseInt(a.replace("F",""));return parseInt(l.replace("F",""))-x});T(r)}else h(t.data.errMsg||"층 데이터를 가져오는 중 오류가 발생했습니다.")}catch(t){console.error("층 데이터 로드 실패:",t),h("층 데이터를 가져오는 중 오류가 발생했습니다.")}finally{j(!1)}},C=async()=>{try{const t={p_NAME:"",p_STATUS:"",p_FLOOR_ID:"",p_SECTION:"",p_DEBUG:"F"},r=await O.post(R.getServerUrl("reservation/reservation/list"),t);r.data.success&&Array.isArray(r.data.data)?u(r.data.data.map(a=>({ROOM_ID:a.ROOM_ID,FLOOR_ID:a.FLOOR_ID,SECTION:a.SECTION,STATUS:a.STATUS==="승인완료"?"사용 중":a.STATUS}))):(h(r.data.errMsg||"예약 데이터를 가져오는 중 오류가 발생했습니다."),u([]))}catch(t){console.error("예약 데이터 로드 실패:",t),h("예약 데이터를 가져오는 중 오류가 발생했습니다."),u([])}};m.useEffect(()=>{D(),C()},[]);const _=t=>{sessionStorage.setItem("selectedFloorId",t);const r="/reservation/ReservationMain";console.log("이동 경로:",r,"선택된 층:",t),p(r,{replace:!0})},N=t=>{const r={"1인실":{total:0,available:0},"2인실":{total:0,available:0},"4인실":{total:0,available:0},"8인실":{total:0,available:0}};return t.forEach(a=>{if(a&&a.ROOM_TYPE){const l=a.ROOM_TYPE;r[l].total+=1,!f.some(d=>d.ROOM_ID===a.ROOM_ID&&d.STATUS==="사용 중")&&(r[l].available+=1)}}),r},E=m.useMemo(()=>o.reduce((t,r)=>{const a=w.filter(i=>i.FLOOR_ID===r),l=a.length,x=f.filter(i=>i.FLOOR_ID===r&&i.STATUS==="사용 중").length,d=l-x,b=["A","B","C"].reduce((i,s)=>{const c=a.filter(g=>g.SECTION===s),y=c.length,v=f.filter(g=>g.FLOOR_ID===r&&g.SECTION===s&&g.STATUS==="사용 중").length,S=y-v,F=N(c);return{...i,[s]:{totalSectionRooms:y,availableSectionRooms:S,roomTypes:F}}},{});return{...t,[r]:{totalRooms:l,availableRooms:d,sections:b}}},{}),[o,w,f]);return I?e.jsx("div",{style:{color:"#d4af37",textAlign:"center",padding:"2rem"},children:"로딩 중..."}):e.jsx("div",{className:B.container,style:{padding:"2rem",minHeight:"100vh",background:"linear-gradient(135deg, #0f172a 0%, #0e141f 100%)",fontFamily:"'Noto Sans KR', sans-serif",display:"flex",justifyContent:"center",alignItems:"flex-start",width:"100vw",margin:0},children:e.jsxs("div",{style:{width:"100%",maxWidth:"1920px",height:"calc(100vh - 4rem)",display:"flex",justifyContent:"space-between",alignItems:"flex-start"},children:[e.jsxs("div",{style:{flex:"0 0 50%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"0 2rem",width:"50%",overflow:"hidden"},children:[e.jsx("h2",{style:{color:"#d4af37",fontSize:"2rem",marginBottom:"2rem",textShadow:"1px 1px 3px rgba(0,0,0,0.3)"},children:"두바이 63 빌딩"}),e.jsxs("div",{style:{flex:"1",display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",width:"100%",maxHeight:"calc(100vh - 150px)",overflowY:"auto",paddingRight:"0.5rem",scrollbarWidth:"thin",scrollbarColor:"#4a5568 #2d3748"},className:"custom-scrollbar",children:[e.jsx("style",{children:`.custom-scrollbar::-webkit-scrollbar {
                width: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #2d3748;
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #4a5568;
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #718096;
              }
              .building-layer {
                position: relative;
                width: 100%;
                max-width: 600px;
                height: 250px;
                background: linear-gradient(135deg, #4a5568 0%, #2d3748 70%, rgba(255,255,255,0.1) 100%);
                border: 2px solid #d4af37;
                border-radius: 12px;
                box-shadow: 0 6px 12px rgba(0,0,0,0.3), inset 0 0 10px rgba(255,255,255,0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 1.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
              }
              .building-layer:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.4), inset 0 0 15px rgba(255,255,255,0.2);
              }
              .top-layer, .bottom-layer {
                height: 280px;
                background: linear-gradient(135deg, #a3bffa 0%, #718096 70%, rgba(255,255,255,0.1) 100%);
              }`}),e.jsx("div",{className:"building-layer top-layer",style:{border:"2px solid #d4af37"},children:"옥상"}),o.map(t=>e.jsx("div",{className:"building-layer",onClick:()=>_(t),onMouseEnter:r=>{r.target.style.transform="translateY(-4px)",r.target.style.boxShadow="0 10px 20px rgba(0,0,0,0.4), inset 0 0 15px rgba(255,255,255,0.2)"},onMouseLeave:r=>{r.target.style.transform="translateY(0)",r.target.style.boxShadow="0 6px 12px rgba(0,0,0,0.3), inset 0 0 10px rgba(255,255,255,0.1)"},children:t},t)),e.jsx("div",{className:"building-layer bottom-layer",style:{border:"2px solid #d4af37"},children:"입구/주차장"})]})]}),e.jsxs("div",{style:{flex:"0 0 50%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"0 2rem",width:"50%",overflow:"hidden"},children:[e.jsx("h2",{style:{color:"#d4af37",fontSize:"1.8rem",marginBottom:"1rem",textShadow:"1px 1px 3px rgba(0,0,0,0.2)"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"1rem"},children:["공실 현황",e.jsxs("div",{style:{display:"flex",gap:"0.5rem"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.3rem"},children:[e.jsx("span",{style:{width:"12px",height:"12px",background:"#a3bffa",borderRadius:"2px"}}),e.jsx("span",{style:{color:"#fff",fontSize:"0.8rem"},children:"예약 가능"})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.3rem"},children:[e.jsx("span",{style:{width:"12px",height:"12px",background:"#f28c82",borderRadius:"2px"}}),e.jsx("span",{style:{color:"#fff",fontSize:"0.8rem"},children:"사용 중"})]})]})]})}),e.jsxs("div",{style:{flex:"1",width:"100%",maxWidth:"650px",overflowY:"auto",maxHeight:"calc(100vh - 7rem)",padding:"0 0 1rem",paddingRight:"0.5rem",scrollbarWidth:"thin",scrollbarColor:"#4a5568 #2d3748"},className:"custom-scrollbar",children:[e.jsx("style",{children:`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                  height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #2d3748;
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #4a5568;
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #718096;
                }
                .tooltip {
                  position: absolute;
                  background: rgba(31,41,55,0.9);
                  color: #fff;
                  padding: 0.6rem 0.8rem;
                  border-radius: 6px;
                  border: 1px solid #4a5568;
                  font-size: 0.85rem;
                  z-index: 10;
                  display: none;
                  white-space: nowrap;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                }
                td:hover .tooltip {
                  display: block;
                  top: calc(100% + 5px);
                  left: 50%;
                  transform: translateX(-50%);
                }
                .room-type-row {
                  display: flex;
                  align-items: center;
                  gap: 0.4rem;
                  margin: 0.2rem 0;
                }
              `}),o.length===0&&e.jsx("div",{style:{color:"#d4af37",textAlign:"center",padding:"1rem",fontSize:"1rem"},children:"데이터가 없습니다."}),e.jsxs("table",{style:{width:"100%",borderCollapse:"separate",borderSpacing:"0",backgroundColor:"rgba(255,255,255,0.03)",borderRadius:"12px",overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.3)"},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{backgroundColor:"#2d3748",color:"#d4af37"},children:[e.jsx("th",{style:{padding:"1rem",textAlign:"left",fontSize:"1rem",border:"1px solid #4a5568"},children:"층"}),e.jsx("th",{style:{padding:"1rem",textAlign:"center",fontSize:"1rem",border:"1px solid #4a5568"},children:"A 섹션"}),e.jsx("th",{style:{padding:"1rem",textAlign:"center",fontSize:"1rem",border:"1px solid #4a5568"},children:"B 섹션"}),e.jsx("th",{style:{padding:"1rem",textAlign:"center",fontSize:"1rem",border:"1px solid #4a5568"},children:"C 섹션"})]})}),e.jsx("tbody",{children:o.map(t=>{const{sections:r}=E[t];return e.jsxs("tr",{children:[e.jsx("td",{style:{padding:"1rem",color:"#fff",fontSize:"0.95rem",fontWeight:"500",border:"1px solid #4a5568"},children:t}),["A","B","C"].map(a=>{const{totalSectionRooms:l,availableSectionRooms:x,roomTypes:d}=r[a],b=Object.entries(d).filter(([s,{total:c}])=>c>0).map(([s])=>e.jsx("div",{className:"room-type-row",style:{color:U[s].color},children:e.jsxs("span",{style:{fontSize:"0.95rem"},children:[s,": 예약 가능"]})},s)),i=Object.entries(d).filter(([s,{total:c}])=>c>0).map(([s,{available:c,total:y}])=>{const v=c===0?"사용 중":"예약 가능",S=Y(k(x,l));return e.jsx("div",{className:"room-type-row",style:{color:S,textShadow:"0 1px 2px rgba(0,0,0,0.5)",fontWeight:500,lineHeight:"1.2"},children:e.jsxs("span",{style:{fontSize:"0.95rem"},children:[s,": ",v]})},s)});return e.jsxs("td",{style:{padding:"1rem",textAlign:"center",background:k(x,l),position:"relative",verticalAlign:"middle",border:"1px solid #4a5568"},children:[e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"0.4rem"},children:i.length>0?i:e.jsx("span",{style:{color:"#d4af37",fontSize:"0.85rem",textShadow:"0 1px 2px rgba(0,0,0,0.5)"},children:"호실 없음"})}),e.jsx("div",{className:"tooltip",children:b.length>0?b:"호실 없음"})]},`${t}-${a}`)})]},t)})})]})]})]})]})})};export{$ as default};
//# sourceMappingURL=ReservationBuilding-CbzrgUY3.js.map
