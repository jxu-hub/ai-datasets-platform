import React from "react";

export function PreviewTable({ data }: { data: string[] }) {
  if (!data || data.length === 0) return <div>暂无预览数据</div>;
  // 找到第一个能被 JSON.parse 且为对象的项作为表头
  let columns: string[] | null = null;
  for (let i = 0; i < data.length; i++) {
    try {
      const obj = JSON.parse(data[i]);
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        columns = Object.keys(obj);
        break;
      }
    } catch (e) {}
  }
  if (!columns) return <div>暂无预览数据</div>;

  return (
    <div className="overflow-auto border rounded-lg max-h-96" style={{ maxWidth: '100vw' }}>
      <table className="min-w-full text-xs border divide-x divide-gray-200" style={{ minWidth: columns.length * 400 }}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={col} className={`px-3 py-2 font-bold bg-muted/30 border-b whitespace-nowrap${idx < columns.length - 1 ? ' border-r' : ''}`}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((rowStr, i) => {
            let row: any = null;
            try {
              row = JSON.parse(rowStr);
            } catch {
              return null;
            }
            if (!row || typeof row !== "object" || Array.isArray(row)) return null;
            const rowBg = i % 2 === 0 ? "bg-white" : "bg-gray-50";
            return (
              <tr key={i} className={`border-b ${rowBg}`}>
                {columns!.map((col, idx) => (
                  <td
                    key={col}
                    className={`px-3 py-2 max-w-xs align-top text-xs${idx < columns.length - 1 ? ' border-r' : ''}`}
                    style={{
                      maxWidth: 800,
                      fontSize: "12px",
                      lineHeight: 1.3,
                      height: "2.6em",
                      minHeight: "2.6em",
                      verticalAlign: "top",
                      whiteSpace: "normal",
                      overflow: "hidden",
                    }}
                    title={String(row[col])}
                  >
                    <div
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "normal",
                        height: "2.6em",
                      }}
                    >
                      {typeof row[col] === "object"
                        ? JSON.stringify(row[col])
                        : String(row[col])}
                    </div>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
