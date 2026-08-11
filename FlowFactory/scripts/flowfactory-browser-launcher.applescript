on run
    set appURL to "http://127.0.0.1:8765/"
    try
        do shell script ("/usr/bin/curl --noproxy '*' -fsS --max-time 3 " & quoted form of appURL)
    on error
        display dialog "Flow Factory 服務尚未啟動（8765）。請先啟動 Flow Factory。" buttons {"好"} default button "好" with icon caution
        return
    end try
    open location appURL
end run
