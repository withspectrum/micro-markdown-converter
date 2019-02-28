// Mock generateRandomKey to be not so random so snapshot tests do not change
jest.mock("draft-js/lib/generateRandomKey.js", () => {
  let first = Math.pow(2, 24);
  return () => Math.floor(first++).toString(32);
});

const listen = require("test-listen");
const request = require("request-promise");
const micro = require("micro");
const dedent = require("dedent");
const handler = require("./index");

let server, url;

beforeEach(async () => {
  server = micro(handler);
  url = await listen(server);
});

afterEach(() => server.close());

it("should throw an error when not using POST", async () => {
  return expect(request(url)).rejects.toMatchInlineSnapshot(
    `[StatusCodeError: 405 - "Please POST your data."]`
  );
});

it("should throw an error when not going to /to or /from", async () => {
  return expect(
    request({ uri: `${url}/bla`, method: "POST" })
  ).rejects.toMatchInlineSnapshot(
    `[StatusCodeError: 404 - "Please POST to either /to or /from."]`
  );
});

describe("/to", () => {
  it("should parse raw content state to markdown", async () => {
    return expect(
      request({
        uri: `${url}/to`,
        method: "POST",
        json: true,
        body: {
          blocks: [
            {
              key: "g0002",
              text:
                "A paragraph with some italic and bold text, some inline code and a link. It also has a link to a YouTube video, which should be rendered as an embed and linkified https://www.youtube.com/watch?v=BmlBxJOb1lY, and it mentions @mxstbr",
              type: "unstyled",
              depth: 0,
              inlineStyleRanges: [
                {
                  offset: 22,
                  length: 6,
                  style: "ITALIC"
                },
                {
                  offset: 33,
                  length: 4,
                  style: "BOLD"
                },
                {
                  offset: 49,
                  length: 11,
                  style: "CODE"
                }
              ],
              entityRanges: [
                {
                  offset: 67,
                  length: 4,
                  key: 0
                }
              ],
              data: {}
            },
            {
              key: "g0003",
              text: "Heading 1",
              type: "header-one",
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            },
            {
              key: "g0004",
              text: "Heading 2",
              type: "header-two",
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            },
            {
              key: "g0005",
              text: "Heading 3",
              type: "header-three",
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            },
            {
              key: "g0006",
              text: "A blockquote",
              type: "blockquote",
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            },
            {
              key: "g0007",
              text: "An",
              type: "unordered-list-item",
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            },
            {
              key: "g0008",
              text: "unordered",
              type: "unordered-list-item",
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            },
            {
              key: "g0009",
              text: "list",
              type: "unordered-list-item",
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            },
            {
              key: "g000a",
              text: "const code = true;",
              type: "code-block",
              depth: 0,
              inlineStyleRanges: [
                {
                  offset: 0,
                  length: 18,
                  style: "CODE"
                }
              ],
              entityRanges: [],
              data: {
                language: "javascript"
              }
            },
            {
              key: "g000b",
              text: "An",
              type: "ordered-list-item",
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            },
            {
              key: "g000c",
              text: "ordered",
              type: "ordered-list-item",
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            },
            {
              key: "g000d",
              text: "list",
              type: "ordered-list-item",
              depth: 0,
              inlineStyleRanges: [],
              entityRanges: [],
              data: {}
            }
          ],
          entityMap: {
            "0": {
              type: "LINK",
              mutability: "MUTABLE",
              data: {
                url: "https://google.com"
              }
            }
          }
        }
      })
    ).resolves.toMatchInlineSnapshot(`
"A paragraph with some _italic_ and **bold** text, some \`inline code\` and a [link](https://google.com). It also has a link to a YouTube video, which should be rendered as an embed and linkified https://www.youtube.com/watch?v=BmlBxJOb1lY, and it mentions @mxstbr

# Heading 1

## Heading 2

### Heading 3

 > A blockquote

- An
- unordered
- list

\`\`\`
const code = true;
\`\`\`

1. An
2. ordered
3. list
"
`);
  });

  it("should throw an error if invalid content state is supplied", () => {
    expect(
      request({
        uri: `${url}/to`,
        method: "POST",
        json: true,
        body: {
          contentState: false
        }
      })
    ).rejects.toMatchInlineSnapshot(
      `not this`
    );
  });
});

describe("/from", () => {
  it("should parse markdown to raw content state", async () => {
    return expect(
      request({
        uri: `${url}/from`,
        method: "POST",
        body: "Hey this is **bold** yay"
      })
    ).resolves.toMatchInlineSnapshot(
      `"{\\"blocks\\":[{\\"key\\":\\"g0001\\",\\"text\\":\\"Hey this is bold yay\\",\\"type\\":\\"unstyled\\",\\"depth\\":0,\\"inlineStyleRanges\\":[{\\"offset\\":12,\\"length\\":4,\\"style\\":\\"BOLD\\"}],\\"entityRanges\\":[],\\"data\\":{}}],\\"entityMap\\":{}}"`
    );
  });

  it("should handle complex markdown", async () => {
    return expect(
      request({
        uri: `${url}/from`,
        method: "POST",
        body: dedent`
          A paragraph with some *italic* and **bold** text, some \`inline code\` and a [link](https://google.com). It also has a link to a YouTube video, which should be rendered as an embed and linkified https://www.youtube.com/watch?v=BmlBxJOb1lY, and it mentions @mxstbr

          # Heading 1

          ## Heading 2

          ### Heading 3

          > A blockquote

          * An
          * unordered
          * list

          \`\`\`javascript
          const code = true;
          \`\`\`

          1. An
          1. ordered
          1. list
        `
      })
    ).resolves.toMatchInlineSnapshot(
      `"{\\"blocks\\":[{\\"key\\":\\"g0002\\",\\"text\\":\\"A paragraph with some italic and bold text, some inline code and a link. It also has a link to a YouTube video, which should be rendered as an embed and linkified https://www.youtube.com/watch?v=BmlBxJOb1lY, and it mentions @mxstbr\\",\\"type\\":\\"unstyled\\",\\"depth\\":0,\\"inlineStyleRanges\\":[{\\"offset\\":22,\\"length\\":6,\\"style\\":\\"ITALIC\\"},{\\"offset\\":33,\\"length\\":4,\\"style\\":\\"BOLD\\"},{\\"offset\\":49,\\"length\\":11,\\"style\\":\\"CODE\\"}],\\"entityRanges\\":[{\\"offset\\":67,\\"length\\":4,\\"key\\":0}],\\"data\\":{}},{\\"key\\":\\"g0003\\",\\"text\\":\\"Heading 1\\",\\"type\\":\\"header-one\\",\\"depth\\":0,\\"inlineStyleRanges\\":[],\\"entityRanges\\":[],\\"data\\":{}},{\\"key\\":\\"g0004\\",\\"text\\":\\"Heading 2\\",\\"type\\":\\"header-two\\",\\"depth\\":0,\\"inlineStyleRanges\\":[],\\"entityRanges\\":[],\\"data\\":{}},{\\"key\\":\\"g0005\\",\\"text\\":\\"Heading 3\\",\\"type\\":\\"header-three\\",\\"depth\\":0,\\"inlineStyleRanges\\":[],\\"entityRanges\\":[],\\"data\\":{}},{\\"key\\":\\"g0006\\",\\"text\\":\\"A blockquote\\",\\"type\\":\\"blockquote\\",\\"depth\\":0,\\"inlineStyleRanges\\":[],\\"entityRanges\\":[],\\"data\\":{}},{\\"key\\":\\"g0007\\",\\"text\\":\\"An\\",\\"type\\":\\"unordered-list-item\\",\\"depth\\":0,\\"inlineStyleRanges\\":[],\\"entityRanges\\":[],\\"data\\":{}},{\\"key\\":\\"g0008\\",\\"text\\":\\"unordered\\",\\"type\\":\\"unordered-list-item\\",\\"depth\\":0,\\"inlineStyleRanges\\":[],\\"entityRanges\\":[],\\"data\\":{}},{\\"key\\":\\"g0009\\",\\"text\\":\\"list\\",\\"type\\":\\"unordered-list-item\\",\\"depth\\":0,\\"inlineStyleRanges\\":[],\\"entityRanges\\":[],\\"data\\":{}},{\\"key\\":\\"g000a\\",\\"text\\":\\"const code = true;\\",\\"type\\":\\"code-block\\",\\"depth\\":0,\\"inlineStyleRanges\\":[{\\"offset\\":0,\\"length\\":18,\\"style\\":\\"CODE\\"}],\\"entityRanges\\":[],\\"data\\":{\\"language\\":\\"javascript\\"}},{\\"key\\":\\"g000b\\",\\"text\\":\\"An\\",\\"type\\":\\"ordered-list-item\\",\\"depth\\":0,\\"inlineStyleRanges\\":[],\\"entityRanges\\":[],\\"data\\":{}},{\\"key\\":\\"g000c\\",\\"text\\":\\"ordered\\",\\"type\\":\\"ordered-list-item\\",\\"depth\\":0,\\"inlineStyleRanges\\":[],\\"entityRanges\\":[],\\"data\\":{}},{\\"key\\":\\"g000d\\",\\"text\\":\\"list\\",\\"type\\":\\"ordered-list-item\\",\\"depth\\":0,\\"inlineStyleRanges\\":[],\\"entityRanges\\":[],\\"data\\":{}}],\\"entityMap\\":{\\"0\\":{\\"type\\":\\"LINK\\",\\"mutability\\":\\"MUTABLE\\",\\"data\\":{\\"url\\":\\"https://google.com\\"}}}}"`
    );
  });
});
