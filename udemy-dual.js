// 動画要素と字幕コンテナの取得
const main = document.getElementsByClassName('ud-main-content-wrapper')[0];

// 開始時間と終了時間を秒に変換する関数
function timeToSeconds(time) {
    var parts = time.split(':');
    var minutes = parseInt(parts[0], 10);
    var seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
}

// 正規表現を使用して字幕を取得する関数
function extractSubtitles(subtitlesText) {
    var regex = /(\d+:\d+\.\d+) --> (\d+:\d+\.\d+)\s*\n([\s\S]*?)(?=\n\n|$)/g;
    var subtitles = [];
    var match;

    while ((match = regex.exec(subtitlesText)) !== null) {
        var startTime = timeToSeconds(match[1]);
        var endTime = timeToSeconds(match[2]);
        var text = match[3].trim();
        subtitles.push({
            startTime: startTime,
            endTime: endTime,
            text: text
        });
    }

    return subtitles;
}

function findSubtitle(searchTime, subtitles) {
    for (var i = 0; i < subtitles.length; i++) {
        var subtitle = subtitles[i];
        if (searchTime >= subtitle.startTime && searchTime <= subtitle.endTime) {
            return subtitle.text;
        }
    }
    return null; // 該当する字幕が見つからない場合はnullを返す
}

// jp_JAのURLを取得する関数
function getJpJaUrl(jsonData) {
    // captions配列からjp_JAのURLを見つける
    var captions = jsonData.asset.captions;
    for (var i = 0; i < captions.length; i++) {
        var caption = captions[i];
        if (caption.locale_id === "ja_JP") {
            return caption.url;
        }
    }   
    return null; // 見つからなかった場合はnullを返す
}

// 新しい要素が追加されたときに実行されるコールバック関数
let isFirst = true;
let preTransText = ''
const mutationCallback = function (mutationsList, observer) {
  for (let mutation of mutationsList) {
    if (mutation.type === 'childList') {
      let video = document.getElementsByClassName('video-player--video-player--2DBqU')[0];
      if (isFirst && video) {

        // 正規表現パターンを使用してIDを抽出
        let pattern = /\/lecture\/(\d+)/;

        let currentURL = window.location.href;
        let match = currentURL.match(pattern);
        if (match && match.length > 1) {
            var lectureId = match[1];
            console.log("ID:", lectureId);
        } else {
            console.log("IDが見つかりませんでした。");
        }

        var courseId = 1362070;
        let captionGetUrl = `https://www.udemy.com/api-2.0/users/me/subscribed-courses/${courseId}/lectures/${lectureId}/?fields[lecture]=asset,description,download_url,is_free,last_watched_second&fields[asset]=captions`

        fetch(captionGetUrl)
        .then(response => {
            // レスポンスをJSON形式に変換
            return response.json();
        })
        .then(data => {

            let jpTransUrl = getJpJaUrl(data);

            fetch(jpTransUrl)
            .then(response => {
                // レスポンスをJSON形式に変換
                return response.text();
            })
            .then(data => {
              let transData = extractSubtitles(data);
              console.log(transData);
              video.addEventListener('timeupdate', () => {
                const currentTime = video.currentTime;

                const transText = findSubtitle(currentTime, transData);

                const videoText = document.getElementsByClassName('captions-display--captions-cue-text--1W4Ia')[0];
                jimaku = document.getElementById('jimaku');
                if(jimaku){
                    jimaku.innerHTML = '<br />' + transText;
                }else{
                    videoText.innerHTML += `<span id="jimaku"><br />${transText}</span>`;
                }

                isFirst = false;
              });
            }) .catch(error => {
                // エラーが発生した場合の処理
                console.error('APIの実行中にエラーが発生しました:', error);
            });
            //extractSubtitles


        })
        .catch(error => {
            // エラーが発生した場合の処理
            console.error('APIの実行中にエラーが発生しました:', error);
        });

      }
    }
  }
};


// MutationObserverの設定
const observerOptions = {
  childList: true, // 子ノードの追加と削除を監視
  subtree: true // ターゲットノードのサブツリーも監視
};
// MutationObserverの作成と監視の開始
const observer = new MutationObserver(mutationCallback);
observer.observe(main, observerOptions);