// 피그마에서 복사한 import 경로의 @버전을 제거하는 스크립트입니다.


import fs from "fs";
import path from "path";

const root = "./src";

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // 패키지명@버전 → 패키지명
  content = content.replace(/(['"])([^'"]+?)@\d+(\.\d+){0,2}(['"])/g, (match, p1, pkg, _, p4) => {
    return `${p1}${pkg}${p4}`;
  });

  fs.writeFileSync(filePath, content, "utf8");
}

function walk(dir) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.lstatSync(full);

    if (stat.isDirectory()) {
      walk(full);
    } else if (full.endsWith(".ts") || full.endsWith(".tsx") || full.endsWith(".js") || full.endsWith(".jsx")) {
      console.log("Fixing:", full);
      fixFile(full);
    }
  }
}

walk(root);
console.log("✔ 완료! 모든 import 경로의 @버전을 제거했습니다.");
