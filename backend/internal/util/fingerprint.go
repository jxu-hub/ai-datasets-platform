package util

import (
	"bufio"
	"io"
	"mime/multipart"
	"strings"
)

type CountingReader struct {
	R     io.Reader
	Count int64
}

// 计数字节封装
func (c *CountingReader) Read(p []byte) (n int, err error) {
	n, err = c.R.Read(p)
	c.Count += int64(n)
	return n, err
}

var InsertFingerprintMap = map[string]string{
	"start": "\uFEFF",
	"0":     "\u2060",
	"1":     "\u2061",
	"2":     "\u2062",
	"3":     "\u2063",
	"4":     "\u2064",
	"5":     "\u206A",
	"6":     "\u206B",
	"7":     "\u200B",
	"8":     "\u200C",
	"9":     "\u200D",
}

var VerifyFingerprintMap = map[string]string{
	"\uFEFF": "start",
	"\u2060": "0",
	"\u2061": "1",
	"\u2062": "2",
	"\u2063": "3",
	"\u2064": "4",
	"\u206A": "5",
	"\u206B": "6",
	"\u200B": "7",
	"\u200C": "8",
	"\u200D": "9",
}

// 插入指纹
func InsertFingerprint(line, timestamp string, pos int) (string, error) {
	if len(timestamp) != 10 {
		return line, nil // 跳过
	}

	var payload string

	if pos == 0 {
		payload = InsertFingerprintMap["start"]
	} else {
		idx := (pos - 1) * 2
		d1 := string(timestamp[idx])
		d2 := string(timestamp[idx+1])
		payload = InsertFingerprintMap[d1] + InsertFingerprintMap[d2]
	}
	return insertIntoJSONStringValue(line, payload), nil
}

// 插入指纹处理函数
func insertIntoJSONStringValue(line, payload string) string {
	lineLen := len(line)
	if lineLen < 6 {
		return line
	}

	// ---------- Step 1: 从后往前 ----------
	if lineLen >= 2 && line[lineLen-2] == '"' && line[lineLen-1] == '}' {
		// 在最后的 " 前插入 payload
		return line[:lineLen-2] + payload + `"}`
	}

	// ---------- Step 2: 从前往后 ----------
	// 找到第一个冒号（允许冒号后有空格）
	idx := strings.Index(line, ":")
	if idx != -1 {
		// 检查冒号后字符（可能是空格）
		j := idx + 1
		for j < lineLen && line[j] == ' ' {
			j++
		}
		if j < lineLen && line[j] == '"' {
			// 在冒号后第一个 " 后插入 payload
			return line[:j+1] + payload + line[j+1:]
		}
	}

	// ---------- Step 3: 保底方案 ----------
	// 插到第一个 key 引号里
	firstQuote := strings.Index(line, `"`)
	if firstQuote != -1 {
		return line[:firstQuote+1] + payload + line[firstQuote+1:]
	}

	return line
}

// 验证函数：从文件中提取零宽时间戳
func VerifyFingerprint(file *multipart.FileHeader) (string, error) {
	f, err := file.Open()
	if err != nil {
		return "", err
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	var lines []string
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}

	for i, line := range lines {
		pos := findFingerprintPosition(line)
		if pos != -1 && containsStart(line, pos) {
			return extractTimestamp(lines, i, pos), nil
		}
	}
	return "无指纹", nil
}

// 本地文件验证函数
//// 验证函数：从文件中提取零宽时间戳
//func VerifyFingerprint(filePath string) (string, error) {
//	file, err := os.Open(filePath)
//	if err != nil {
//		return "", err
//	}
//	defer file.Close()
//
//	scanner := bufio.NewScanner(file)
//	var lines []string
//	for scanner.Scan() {
//		lines = append(lines, scanner.Text())
//	}
//
//	for i, line := range lines {
//		pos := findFingerprintPosition(line)
//		if pos != -1 && containsStart(line, pos) {
//			return extractTimestamp(lines, i, pos), nil
//		}
//	}
//	fmt.Println("未找到指纹")
//	return "", nil
//}

// 查找当前行指纹插入点类型（0=“}前”，1=“:”后，2=第一个key的“后”，-1=无）
func findFingerprintPosition(line string) int {
	if len(line) < 2 {
		return -1
	}
	if line[len(line)-2] == '"' && line[len(line)-1] == '}' {
		return 0
	}
	if idx := strings.Index(line, ":"); idx != -1 {
		j := idx + 1
		for j < len(line) && line[j] == ' ' {
			j++
		}
		if j < len(line) && line[j] == '"' {
			return 1
		}
	}
	if strings.Index(line, `"`) != -1 {
		return 2
	}
	return -1
}

// 判断在指定位置是否存在start字符
func containsStart(line string, pos int) bool {
	target := "\uFEFF"
	switch pos {
	case 0:
		return strings.Contains(line[len(line)-5:], target)
	case 1:
		idx := strings.Index(line, ":")
		return idx != -1 && strings.Contains(line[idx:], target)
	case 2:
		firstQuote := strings.Index(line, `"`)
		return firstQuote != -1 && strings.Contains(line[firstQuote:], target)
	default:
		return false
	}
}

// 根据起点行与插入点提取后续时间戳字符
func extractTimestamp(lines []string, startIdx, pos int) string {
	var timestamp strings.Builder
	for i := startIdx + 1; i < len(lines) && i <= startIdx+5; i++ {
		chunks := extractTwoDigits(lines[i], pos)
		timestamp.WriteString(chunks)
	}
	return timestamp.String()
}

// 提取当前行插入点处的两个零宽字符对应的数字
func extractTwoDigits(line string, pos int) string {
	switch pos {
	case 0:
		return findDigits(line[len(line)-8:])
	case 1:
		idx := strings.Index(line, ":")
		if idx == -1 {
			return ""
		}
		return findDigits(line[idx:])
	case 2:
		firstQuote := strings.Index(line, `"`)
		if firstQuote == -1 {
			return ""
		}
		return findDigits(line[firstQuote:])
	default:
		return ""
	}
}

// 提取零宽字符对应的数字
func findDigits(s string) string {
	var res strings.Builder
	for _, r := range s {
		if v, ok := VerifyFingerprintMap[string(r)]; ok && v != "start" {
			res.WriteString(v)
		}
	}
	return res.String()
}
