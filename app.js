// node_modules 에 있는 express 관련 파일을 가져옴
var express = require('express')

const bodyPaser = require('body-parser'); /* post로 요청된 body를 쉽게 추출할 수 있는 모듈 */
const ejs = require('ejs'); /* JavaScript로 HTML 마크업을 생성할 수 있는 간단한 템플릿 언어 */
const fs = require('fs');  /* file system */
const path = require('path');

// express 는 함수이므로, 반환값을 변수에 저장
var app = express()


/* Express가 템플리트를 렌더링하려면 다음과 같은 애플리케이션 설정이 필요 */
app.set('views', './views'); /* view 템플릿이 있는 디렉토리 */
app.set('view engine', 'ejs'); /* 사용할 템플릿 엔진 */


app.use(bodyPaser.urlencoded({extended: false}));   /* bodyParser.urlencoded()를 등록하면, 자동으로 req에 body속성이 추가되고 저장 */
app.use(bodyPaser.json())

app.use(express.static(__dirname + '/views'));  /* Express에서 정적 파일 제공 */


const dataPath = path.join('.','data', 'series.json'); /* 인자로 받은 경로들을 하나로 합쳐서 문자열 형태로 path를 리턴한다 */
const readJson = fs.readFileSync(dataPath); /* fs.readFileSync(filename, [options]) : filename의 파일을 [options]의 방식으로 읽은 후 문자열 반환.(동기적) */
/* console.log('before parsing', readJson) */
let datas = JSON.parse(readJson); /* parse 메소드는 string 객체를 json 객체로 변환시킴. */ /* JSON:js전체 영역에서 사용할 수 있는 전역객체 */
/* console.log('after parsing', data) */




/* 게시판 화면, 필터 */
app.get('/', (req, res) => {  /* '/' = url */
  let {filter} = req.query;   /* req.query에서 쿼리를 얻을 수 있음 */
  //console.log(filter); /* 검색버튼 누르면 검색한거 콘솔찍힘 */
  let filterdata = [...datas]; /* datas의 단순한 값만 가져오는 것이니까 ... 이라는 연산자를 이용하여 객체에 속한 값만 들고 오게 할 수 있음. */
  
  if (filter) {
    filterdata = datas.filter(element => {
      return element.content.toLowerCase().match(filter.toLowerCase()) || element.writer.toLowerCase().match(filter.toLowerCase());
            /*  toLowerCase 는 영문자를 모두 소문자로 변경하는 함수 */ /* ||는 or */
    })
  }
  console.log(filterdata);
  res.render('index', {datas:filterdata, filter});   /* 템플릿 엔진쓸때 res.render쓴다. 클라이언트에게 렌더링 된 html문자열 보냄 */
});                                                  /* datas:filterdata 안해주면 검색안됨 */

/* 등록 */
app.get('/add', (req, res) => {  
  res.render('add', {
    content: '등록하기!', /* 등록누르면 페이지넘어가서 상단에 뜸 */
    selecteddata: '',   /* 수정에 let selecteddata 선언 해놨기 때문에 이 줄 없으면 등록 눌렀을때 selecteddata정의안됐다고뜸 */
    action: '/add' /* 수정에는 action: '/edit' */
                   /* 등록과 수정을 눌렀을때 submit가 동일하게 /add. -> action지정하여 이동하게함 */ 
  }); 
});
app.post('/add', (req, res) => {
  /* 등록날짜+시간 */
  let today = new Date();   

  let year = today.getFullYear(); // 년도
  let month = today.getMonth() + 1;  // 월 (1월이 0으로 나와서)
  let date = today.getDate();  // 날짜
  let hours = today.getHours(); // 시
  let minutes = today.getMinutes();  // 분

  const { content, writer } = req.body;

  const newdata = {
    number: datas.length + 1,
    content: content,
    writer:writer,
    create: year + '/' + month + '/' + date + '\n' + hours + ':' + minutes
  };
  /* console.log('before',datas); */
  datas.push(newdata);
  /* console.log('after',datas); */

  fs.writeFileSync(dataPath, JSON.stringify(datas, null, 4));    /* JSON.stringify( )는 자바스크립트의 값을 JSON 문자열로 변환한다. */
  /* ↑ fs.writeFileSync(filename, data, [options]) : filename의 파일에 [options]의 방식으로 data 내용을 씀.(동기적) */
  /* submit누르면 series.json에 추가됨  */
  res.redirect('/');
});

/* 수정1 (수정하기 버튼 눌러서 수정창으로 이동)*/
app.get('/edit/:number', (req, res) => {
  const {number} = req.params;
  //console.log(number);  // 콘솔에숫자정렬(질문)

  let selecteddata = datas.filter(element => {
    return element.number === parseInt(number); 
  });
  
  res.render('add', {
  selecteddata: selecteddata[0], /* 동일한 ID를 포함하는 데이터를 찾은 다음 데이터를 전달하여 편집 페이지를 렌더링 */
  content: '수정하기!',
  action: `/edit/${number}`  /* -> form action='/edit/number' */
  });
});
/* 수정2 (내용 바꿔서 등록) */
app.post('/edit/:number', (req,  res) => {
  const { number } = req.params;
  const { content, writer } = req.body;

  for (let i = 0; i < datas.length; i++) {
    if(datas[i].number === parseInt(number)) {
     datas[i].content = content;
     datas[i].writer = writer;
    }
  }
  fs.writeFileSync(dataPath, JSON.stringify(datas, null, 4));
  res.redirect('/');
});


/* 삭제 */
app.get('/delete/:number', (req, res) => {
  const{number} = req.params;
  console.log(req.params);

   let newdatas =[];                           //방법1
   for (let i = 0; i < datas.length; i++) {
     if (Number(number) !== datas[i].number) {
      newdatas.push(datas[i])
    }
  }  

  //let newdatas = datas.filter(element => {    //방법2        filter:특정 조건을 만족하는 새로운 배열을 필요로 할 때 사용
  //  console.log('number -> ', typeof number);                        //    number ->  string 
  //  return element.number !== parseInt(number); 
  //}); 

  datas = newdatas; //   const datas = JSON.parse(readJson); -> let datas = JSON.parse(readJson);로 변경해줌. datas변수 또 선언해서 
  fs.writeFileSync(dataPath, JSON.stringify(datas, null, 4));
  res.redirect('/');
});

  //3000 포트로 서버 오픈
app.listen(3000, function() {
  console.log("start! express server on port http://localhost:3000")
});















 /* request 와 response 라는 인자를 줘서 콜백 함수를 만든다.
 localhost:3000 브라우저에 res.sendFile() 내부의 파일이 띄워진다.
 app.get('/', function(req,res) {
  res.sendFile(__dirname + "/views/main.html")
})
 
 localhost:3000/main 브라우저에 res.sendFile() 내부의 파일이 띄워진다.
 app.get('/main', function(req,res) {
  res.sendFile(__dirname + "/views/main.html")
})

app.use(express.static('views')); */



