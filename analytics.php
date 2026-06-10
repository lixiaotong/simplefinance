<?php
/**
 * 访问统计 API
 * GET  /analytics.php       — 获取当前统计数据
 * POST /analytics.php       — 记录一次访问，返回更新后的数据
 *
 * 数据文件: analytics_data.json (自动创建)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataFile = __DIR__ . '/analytics_data.json';

// 读取现有数据
function loadData($file) {
    if (!file_exists($file)) {
        return ['visits' => [], 'total' => 0, 'firstVisit' => time() * 1000];
    }
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    if (!$data || !isset($data['visits'])) {
        return ['visits' => [], 'total' => 0, 'firstVisit' => time() * 1000];
    }
    return $data;
}

// 保存数据
function saveData($file, $data) {
    file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
}

// 获取访客 IP（考虑代理）
function getClientIP() {
    $headers = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
    foreach ($headers as $h) {
        if (!empty($_SERVER[$h])) {
            $ips = explode(',', $_SERVER[$h]);
            $ip = trim($ips[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return 'unknown';
}

$data = loadData($dataFile);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ip = getClientIP();
    $now = time() * 1000;

    if (!isset($data['visits'][$ip])) {
        $data['visits'][$ip] = ['count' => 0, 'first' => $now, 'last' => $now];
    }
    $data['visits'][$ip]['count'] += 1;
    $data['visits'][$ip]['last'] = $now;
    $data['total'] += 1;

    saveData($dataFile, $data);
}

// 返回统计数据（不返回具体 IP，只返回汇总信息）
$summary = [
    'totalVisits'  => $data['total'],
    'uniqueIPs'    => count($data['visits']),
    'firstVisit'   => $data['firstVisit'],
    'lastVisit'    => $data['total'] > 0 ? max(array_column($data['visits'], 'last')) : time() * 1000,
];

echo json_encode($summary, JSON_UNESCAPED_UNICODE);
