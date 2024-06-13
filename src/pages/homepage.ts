import { stringTemplate } from '../common/str';

const html = String;
const HTML: string = html`
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8" />
        <title>Little Helper Homepage</title>
        <style>
                html, body, table{width:100%;height:100%;margin: 0;padding: 0;}
                fieldset{width:300px;border-radius: 6px;padding:1%}
        </style>
    </head>
    <body>
        <table>
            <tr>
                <td valign="middel" align="center">
                <h1>Welcome to the Little Helper!</h1>
                <br />
                <a href="https://github.com/sp42/little-helper">Github</a> | <a href="https://blog.csdn.net/zhangxin09">Blog</a>
                </td>
            </tr>
        </table>
    </body>
</html>
`;

export function Layout(props: any): string {
    return stringTemplate(HTML, props);
}