export default `<html>
<head>
        <title>Short URL</title>
        <style>
                html, body, table{width:100%;height:100%;margin: 0;padding: 0;}
                fieldset{width:300px;border-radius: 6px;padding:1%}
        </style>
        <script>
                function submitForm2() {
                        var xhr = new XMLHttpRequest(), url = 's', target = document.querySelector("input[name=url]").value;
                        xhr.open('POST', url, true);
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        xhr.onreadystatechange = function() {
                                if (xhr.readyState === XMLHttpRequest.DONE) {
                                        if (xhr.status === 200) {
                                               
                                                let u = JSON.parse(xhr.responseText).key;
                                                if(u)
                                                 alert('添加成功！');
                                                let result = document.querySelector('.result');
                                                result.innerHTML = u || JSON.parse(xhr.responseText).msg;
                                                if(u)
                                                  result.setAttribute('href', u);
                                        } else 
                                                console.error('请求失败');
                                }
                        };
                        xhr.send(JSON.stringify({url: target}));
                }
        </script>
</head>
<body>
        <table>
                <tr><td valign="middel" align="center">
                        <fieldset>
                                <legend>Short URL</legend>
                                <input type="url" placeholder="Input your URL" name="url" />
                                <button onclick="submitForm2();return false;">Submit</button><br /><br />
                                The result: <a class="result" target="_blank"></a>
                        </fieldset>
                </td></tr>
        </table>
</body>
</html>`;