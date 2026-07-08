const { spawn } = require('child_process');
const http = require('http');

(async () => {
  console.log("Starting backend server...");
  const backend = spawn('npm', ['run', 'dev'], { cwd: 'server' });
  
  backend.stdout.on('data', data => process.stdout.write(`BACKEND: ${data}`));
  backend.stderr.on('data', data => process.stderr.write(`BACKEND ERROR: ${data}`));
  
  await new Promise(r => setTimeout(r, 3000));
  
  // 1. Get Token
  const reqData = JSON.stringify({ username: 'admin', password: 'Paras@1123' });
  const tokenReq = http.request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': reqData.length }
  }, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      const data = JSON.parse(body);
      if (!data.success) { console.log("Login failed"); process.exit(1); }
      const token = data.data.token;
      
      // 2. Fetch Content
      const getReq = http.request({
        hostname: 'localhost',
        port: 4000,
        path: '/api/admin/content',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }, res2 => {
        let body2 = '';
        res2.on('data', d => body2 += d);
        res2.on('end', () => {
          console.log("GET /content:", body2.substring(0, 200) + "...");
          const contentData = JSON.parse(body2);
          
          if (!contentData.success || !contentData.data || contentData.data.length === 0) {
            console.log("No content found!");
            process.exit(1);
          }
          
          // 3. Update Content
          const firstId = contentData.data[0].id;
          const updatePayload = JSON.stringify({ [firstId]: 'Updated Value' });
          
          const putReq = http.request({
            hostname: 'localhost',
            port: 4000,
            path: '/api/admin/content',
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': updatePayload.length }
          }, res3 => {
            let body3 = '';
            res3.on('data', d => body3 += d);
            res3.on('end', () => {
              console.log("PUT /content response:", body3);
              backend.kill();
              process.exit(0);
            });
          });
          putReq.write(updatePayload);
          putReq.end();
        });
      });
      getReq.end();
    });
  });
  tokenReq.write(reqData);
  tokenReq.end();
})();
