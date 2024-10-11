const express = require('express');
const cors = require('cors');
const path = require('path');
const spawn = require('child_process').spawn;
const port = 8080;
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

const pythonExePath = isDevelopment() 
  ? path.join("C:", "conda", "envs", "recom_env", "python.exe")
  :  path.join(
    '/root/miniconda',
    'envs',
    'movie_app',
    'bin',
    'python3'
  );

// get /
app.get('/', (req, res) => {
  res.send('Hello from movie_recommend node server!');

});

// get random
app.get('/random/:count', (req, res) => {
  const firstParam = "random";
  const secondParam = req.params.count; // URL의 :count 값을 가져와 저장
  
  const scriptPath = path.join(__dirname, "resolver.py")

  const result = spawn(pythonExePath, [scriptPath, firstParam, secondParam]);
  let responseData = '';

  // Python script 출력 결과를 받아온다.
  result.stdout.on('data', (data) => {
    responseData += data.toString();
  });
  
  // child process 이벤트 종료시 핸들링
  result.on('close', (code) => {
    if (code === 0) {
      const jsonResponse = JSON.parse(responseData);
      res.status(200).json(jsonResponse);
    } else {
      res
        .status(500).json({ error: `Child process exited with code ${code}` });
    }
  });

  // Python script Error 출력
  result.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

});

// get latest
app.get('/latest/:count', (req, res) => {
  try {
    const count = parseInt(req.params.count);
    // EC2 서버에서 현재 실행 중인 Node.js 파일의 절대 경로를 기준으로 설정.
    const scriptPath = path.join(__dirname, 'resolver.py');


    // Spawn the Python process with the correct argument
    const result = spawn(pythonExePath, [scriptPath, 'latest', count]);


    let responseData = '';
    let errorData = '';


    // Listen for data from the Python script
    result.stdout.on('data', (data) => {
      responseData += data.toString();
    });


    // Listen for errors from the Python script
    result.stderr.on('data', (data) => {
      errorData += data.toString(); // Collect stderr data
      console.error(`stderr: ${data}`); // Log the error
    });


    // Handle the close event of the child process
    result.on('close', (code) => {
      if (code === 0) {
        try {
          const jsonResponse = JSON.parse(responseData);
          res.status(200).json(jsonResponse);
        } catch (error) {
          res
            .status(500)
            .json({ error: 'Failed to parse Python output as JSON' });
        }
      } else {
        res.status(500).json({
          error: errorData || `Child process exited with code ${code}`,
        });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


// get genres
app.get('/genres/:genre/:count', (req, res) => {
  const firstParam = "genres";
  const secondParam = req.params.genre; // URL의 :genre 값을 가져와 저장
  const thirdParam = req.params.count; // URL의 :count 값을 가져와 저장
  
  const scriptPath = path.join(__dirname, "resolver.py")

  const result = spawn(pythonExePath, [scriptPath, firstParam, secondParam, thirdParam]);
  let responseData = '';

  // Python script 출력 결과를 받아온다.
  result.stdout.on('data', (data) => {
    responseData += data.toString();
  });
  
  // child process 이벤트 종료시 핸들링
  result.on('close', (code) => {
    if (code === 0) {
      const jsonResponse = JSON.parse(responseData);
      res.status(200).json(jsonResponse);
    } else {
      res
        .status(500).json({ error: `Child process exited with code ${code}` });
    }
  });

  // Python script Error 출력
  result.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
});

app.get('/item-based/:item', (req, res) => {
  const firstParam = "item-based";
  const secondParam = req.params.item; // URL의 :count 값을 가져와 저장
  
  const scriptPath = path.join(__dirname, "recommender.py")
  // const pythonPath = path.join("C:", "conda", "envs", "recom_env", "python.exe");

  const result = spawn(pythonExePath, [scriptPath, firstParam, secondParam]);
  let responseData = '';

  // Python script 출력 결과를 받아온다.
  result.stdout.on('data', (data) => {
    responseData += data.toString();
  });
  
  // child process 이벤트 종료시 핸들링
  result.on('close', (code) => {
    if (code === 0) {
      const jsonResponse = JSON.parse(responseData);
      res.status(200).json(jsonResponse);
    } else {
      res
        .status(500).json({ error: `Child process exited with code ${code}` });
    }
  });

  // Python script Error 출력
  result.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
});

app.post('/user-based', (req, res) => {
  const firstParam = "user-based";

  const scriptPath = path.join(__dirname, "recommender.py")

  const inputRatingDict = req.body;

  const result = spawn(pythonExePath, [scriptPath, firstParam]);
  let responseData = '';

  // 파이썬 스크립트로 JSON 데이터를 전달
  result.stdin.write(JSON.stringify(inputRatingDict));
  result.stdin.end(); // 더 이상 데이터가 없으면 전달 끝

  // Python script 출력 결과를 받아온다.
  result.stdout.on('data', (data) => {
    responseData += data.toString();
  });
  
  // child process 이벤트 종료시 핸들링
  result.on('close', (code) => {
    if (code === 0) {
      const jsonResponse = JSON.parse(responseData);
      res.status(200).json(jsonResponse);
    } else {
      res
        .status(500).json({ error: `Child process exited with code ${code}` });
    }
  });

  // Python script Error 출력
  result.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
