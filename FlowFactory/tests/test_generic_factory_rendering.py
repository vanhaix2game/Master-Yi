import json
import re
import struct
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class GenericFactoryRenderingTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.server = (ROOT / "server.py").read_text(encoding="utf-8")
        cls.config = json.loads((ROOT / "workflows.json").read_text(encoding="utf-8"))

    def test_factory_switch_uses_only_generic_renderer(self):
        start = self.html.index("function switchFactory(wf,userInitiated=false)")
        end = self.html.index("function renderGenericFactory()", start)
        switch_body = self.html[start:end]
        self.assertIn("renderGenericFactory()", switch_body)
        self.assertNotIn("今日金融母版工廠", switch_body)
        self.assertNotIn("url-to-short短視頻工廠", switch_body)

    def test_migrated_factories_have_complete_generic_steps(self):
        factories = {factory["name"]: factory for factory in self.config["workflows"]}
        self.assertEqual(["新聞收集員（阿明）"], list(factories))
        for factory_name in ("新聞收集員（阿明）",):
            steps = factories[factory_name]["steps"]
            self.assertTrue(steps)
            for step in steps:
                self.assertTrue(step.get("id"), f"{factory_name} 有流程缺少 id")
                self.assertTrue(step.get("prompt") or step.get("script"), f"{factory_name}/{step.get('title')} 缺少提示詞或腳本")
                self.assertIn(step.get("type"), ("prompt", "script"))
                self.assertIsInstance(step.get("fields"), list)
                self.assertIsInstance(step.get("outputs"), list)

    def test_dependencies_reference_steps_in_same_factory(self):
        for factory in self.config["workflows"]:
            step_ids = {str(step.get("id")) for step in factory.get("steps", [])}
            for step in factory.get("steps", []):
                dependencies = step.get("dependsOn", [])
                if not isinstance(dependencies, list):
                    dependencies = [dependencies]
                for dependency in dependencies:
                    self.assertIn(str(dependency), step_ids)

    def test_output_directory_placeholder_is_replaced_as_literal_text(self):
        self.assertIn("replaceAll('${OUT}',outputDir)", self.html)
        self.assertNotIn("replaceAll(OUT,outputDir)", self.html)

    def test_collapsed_prompt_preview_has_its_shared_toggle_helper(self):
        self.assertIn("function bindPromptPreview(", self.html)
        self.assertIn("bindPromptPreview('promptPreviewWrap','genericPromptToggle',false)", self.html)

    def test_factory_icon_uses_user_selected_fixed_employee_role(self):
        expected_sizes = {
            "assistant-a": (96, 96),
            "assistant-b": (96, 96),
            "assistant-c": (96, 96),
            "assistant-d": (96, 96),
            "assistant-e": (96, 96),
            "assistant-g": (96, 96),
            "assistant-h": (96, 96),
            "assistant-i": (96, 96),
        }
        for role, expected_size in expected_sizes.items():
            icon = ROOT / "assets" / "employees" / f"{role}.png"
            self.assertTrue(icon.is_file())
            self.assertGreater(icon.stat().st_size, 1000)
            self.assertEqual(expected_size, struct.unpack(">II", icon.read_bytes()[16:24]))
        self.assertIn("const EMPLOYEE_ICONS=", self.html)
        self.assertIn("function normalizeEmployeeIcon(value)", self.html)
        self.assertIn("function factoryIconHtml(icon='assistant_a',name='員工')", self.html)
        self.assertIn('id="employeeIconPicker"', self.html)
        self.assertIn('name="employeeIcon" value="assistant_a"', self.html)
        self.assertFalse((ROOT / "assets" / "employees" / "assistant-f.png").exists())
        self.assertNotIn("assistant_f", self.html)
        self.assertNotIn("function factoryNameHash(name)", self.html)
        self.assertNotIn("function factoryColors(name)", self.html)
        self.assertNotIn("coloredFactoryIcon(", self.html)
        self.assertIn('<span class="icon">${factoryIconHtml(w.employee_icon,w.name||w.id)}</span>', self.html)
        self.assertIn("genericFactoryTitle').innerHTML=`${factoryIconHtml(factory.employee_icon,factory.name||factory.id)}", self.html)
        self.assertIn('id="genericFactoryId">員工 ID：—', self.html)
        self.assertIn('id="copyFactoryId"', self.html)
        self.assertIn("genericFactoryId').textContent=`員工 ID：${factory.id}`", self.html)
        self.assertIn("copyFactoryId').onclick=()=>{const factory=currentFactory();if(factory)copyText(factory.id,$('#copyFactoryId'),'複製')}", self.html)
        for factory in self.config["workflows"]:
            self.assertIn(factory["employee_icon"], {f"assistant_{letter}" for letter in "abcdefghi"})

    def test_factory_cards_show_description_on_hover(self):
        # v1.52.1：hover/選中卡片展開顯示簡介（nav-item-desc），移除浮動 tooltip
        self.assertIn("<h2>我的員工</h2>", self.html)
        self.assertNotIn("<h2>👥 我的員工</h2>", self.html)
        self.assertNotIn('id="factoryDescriptionTooltip"', self.html)
        self.assertNotIn("bindFactoryDescriptionTooltips", self.html)
        self.assertIn('data-description="${esc(w.description||', self.html)
        self.assertIn('class="nav-item-desc">', self.html)
        self.assertIn(".nav-item:hover .nav-item-desc", self.html)

    def test_legacy_radar_settings_are_removed(self):
        self.assertNotIn("automoney_radar", self.html)
        self.assertNotIn("data-settings-file=\"radar\"", self.html)
        self.assertNotIn("RADAR_FILE", self.server)
        self.assertNotIn("/api/radar", self.server)

    def test_factory_flow_logo_and_svg_menus_are_used(self):
        logo = ROOT / "factory-flow-logo.png"
        header_logo = ROOT / "factory-flow-header-logo.png"
        self.assertTrue(logo.is_file())
        self.assertTrue(header_logo.is_file())
        self.assertGreater(logo.stat().st_size, 1000)
        self.assertGreater(header_logo.stat().st_size, 1000)
        self.assertEqual((256, 256), struct.unpack(">II", logo.read_bytes()[16:24]))
        self.assertEqual((256, 256), struct.unpack(">II", header_logo.read_bytes()[16:24]))
        self.assertEqual(6, header_logo.read_bytes()[25], "頁首 Logo 必須是帶透明通道的 RGBA PNG")
        self.assertIn('rel="icon" href="factory-flow-logo.png"', self.html)
        self.assertIn('class="brand-logo" src="factory-flow-header-logo.png"', self.html)
        self.assertIn('class="brand-home" href="https://flowfactory.xtoolbot.com/" target="_blank" rel="noopener noreferrer"', self.html)
        self.assertIn('aria-label="在新分頁開啟 FlowFactory 主頁"', self.html)
        self.assertNotIn('<div class="brand-mark">FF</div>', self.html)
        self.assertIn("function menuIconSvg()", self.html)
        self.assertNotIn('aria-label="員工排序與設定"', self.html)  # v1.52.1：已移除員工排序按鈕
        self.assertNotIn('aria-label="流程排序與設定"', self.html)  # v1.52.0：已移除流程排序按鈕
        self.assertNotIn('id="lockFlowBtn"', self.html)
        self.assertNotIn('id="factoryLockBtn"', self.html)
        self.assertNotIn("'🔒'", self.html)
        self.assertNotIn("'🔓'", self.html)

    def test_factory_names_do_not_collapse_into_vertical_text(self):
        self.assertIn("text-overflow:ellipsis;white-space:nowrap", self.html)
        # v1.52.1：員工 ✎ 常駐顯示（與流程卡片一致），不再依賴 factoryEditMode
        self.assertIn("class=\"factory-actions\"", self.html)
        self.assertIn('data-edit-factory=', self.html)
        self.assertNotIn("style=\"display:${state.factoryEditMode", self.html)

    def test_factory_and_flow_cards_can_be_duplicated_next_to_their_edit_actions(self):
        # v1.52.1：員工複製/刪除移到「修改員工資料」dialog 頭部（factoryDialogCopyBtn / factoryDialogDeleteBtn）
        self.assertNotIn('data-copy-factory=', self.html)
        self.assertNotIn('data-delete-factory=', self.html)
        self.assertIn('factoryDialogCopyBtn', self.html)
        self.assertIn('factoryDialogDeleteBtn', self.html)
        self.assertIn('duplicateFactory(factory.id)', self.html)
        self.assertIn('deleteFactory(factory.id)', self.html)
        self.assertIn('flowDialogCopyBtn', self.html)
        self.assertIn('flowDialogDeleteBtn', self.html)
        self.assertIn('duplicateFlow(step.id)', self.html)
        self.assertIn('deleteFlow(step.id)', self.html)
        self.assertIn('async function duplicateFactory(factoryId)', self.html)
        self.assertIn('workflowConfig.workflows.splice(index+1,0,copy)', self.html)
        self.assertIn('async function duplicateFlow(stepId)', self.html)
        self.assertIn('factory.steps.splice(index+1,0,copy)', self.html)
        self.assertIn("copy.title=copyDisplayName(source.title||source.id,factory.steps)", self.html)

    def test_settings_dialog_can_scroll_to_all_controls(self):
        self.assertIn(".settings-layout{display:grid;grid-template-columns:190px", self.html)
        self.assertIn(".settings-content{min-width:0;overflow-y:auto", self.html)
        self.assertIn(".settings-panel{display:none}.settings-panel.active{display:block}", self.html)
        self.assertEqual(7, len(re.findall(r'<button[^>]+data-settings-nav=', self.html)))
        self.assertEqual(7, len(re.findall(r'<section[^>]+data-settings-panel=', self.html)))
        self.assertIn("function switchSettingsPanel(name)", self.html)

    def test_copy_action_uses_generic_agent_wording(self):
        self.assertIn("複製任務給 Agent", self.html)
        self.assertNotIn("複製任務給 Hermes", self.html)

    def test_direct_execution_requires_an_explicit_agent_connection(self):
        self.assertIn("尚未連接 Agent", self.html)
        self.assertIn("/api/agent/settings", self.html)
        self.assertIn("/api/agent/run", self.html)
        self.assertIn("/api/agent/status", self.html)
        self.assertNotIn("/api/hermes/run", self.html)
        self.assertIn("你是任務執行 Agent", self.html)
        self.assertIn("AGENT_SETTINGS_FILE", self.server)

    def test_agent_settings_include_video_guide(self):
        self.assertIn("https://www.youtube-nocookie.com/embed/cXAYjos2BKg", self.html)
        self.assertIn("Agent 連接教學影片", self.html)
        self.assertIn('class="btn" id="copyAgentSetupPrompt"', self.html)
        self.assertIn("agent_settings.json", (ROOT / ".gitignore").read_text(encoding="utf-8"))
        self.assertIn("複製 Webhook 建立提示詞", self.html)
        self.assertIn("把提示詞貼到任何 Agent 的聊天視窗", self.html)
        self.assertIn("Agent 會回傳一個連接地址", self.html)
        self.assertIn("UNSUPPORTED_WEBHOOK", self.html)
        self.assertIn('"status": "READY"', self.html)
        self.assertIn('"status": "accepted"', self.html)
        self.assertIn('"result_url"', self.html)
        self.assertIn("GET /tasks/<id>", self.html)
        self.assertIn("禁止只回傳 queued", self.html)
        self.assertIn("Location Header", self.html)
        self.assertIn("持續 GET result_url，直到 completed 或 failed", self.html)
        self.assertIn("連接並測試", self.html)
        self.assertIn("斷開 Agent", self.html)
        self.assertIn("/api/agent/test", self.html)
        self.assertIn("/api/agent/disconnect", self.html)
        self.assertIn("'verified': False", self.server)
        self.assertIn("build_webhook_headers", self.server)
        self.assertIn("X-Hub-Signature-256", self.server)
        self.assertIn("ProxyHandler({})", self.server)

    def test_header_status_reports_agent_and_opens_agent_settings(self):
        self.assertIn('id="agentHeaderStatus"', self.html)
        self.assertIn('id="agentHeaderText">Agent 狀態讀取中', self.html)
        self.assertIn("function renderHeaderAgentStatus()", self.html)
        self.assertIn("'Agent 未連接'", self.html)
        self.assertIn("+' 已連接'", self.html)
        self.assertIn("$('#agentHeaderStatus').onclick=()=>{openSettings();switchSettingsPanel('agent')}", self.html)
        self.assertNotIn('id="liveStatus"', self.html)
        self.assertNotIn('id="liveText"', self.html)

    def test_agent_task_state_survives_flow_navigation(self):
        self.assertIn("state.agentTasks||={}", self.html)
        self.assertIn("function agentTaskKey(factoryId,stepId)", self.html)
        self.assertIn("function restoreAgentTaskUi(factoryId,stepId)", self.html)
        self.assertIn("restoreAgentTaskUi(factory.id,step.id)", self.html)
        self.assertIn("flowRunStateHtml(factory.id,s.id)", self.html)

    def test_completed_task_uses_separate_status_and_explicit_rerun(self):
        self.assertIn('id="hermesRunComplete" hidden>✓ 此流程已完成', self.html)
        self.assertIn("button.textContent='▶ 重新執行'", self.html)
        self.assertNotIn("button.innerHTML='執行完成 ✓'", self.html)

    def test_input_fields_accept_dropped_local_file_paths(self):
        self.assertIn("function droppedLocalPath(dataTransfer)", self.html)
        self.assertIn("function bindFilePathDrop(input)", self.html)
        self.assertIn("dataTransfer.getData('text/uri-list')", self.html)
        self.assertIn("dataTransfer.getData('text/plain')", self.html)
        self.assertIn("input.dispatchEvent(new Event('input'", self.html)
        self.assertIn("bindFilePathDrop(input)", self.html)
        self.assertIn("可将文件拖到输入框，自动填写完整路径", self.html)
        self.assertNotIn("['url','number','date','file'].includes(f.type)", self.html)

    def test_right_workspace_file_input_suggests_global_output_paths(self):
        self.assertIn(' list="ff7OutputPathOptions"', self.html)
        self.assertIn("refreshOutputPathOptions();", self.html)
        self.assertIn("可從下拉選擇流程輸出檔案，或手動輸入", self.html)

    def test_running_agent_task_has_a_real_stop_action(self):
        self.assertIn('id="stopAgentTask" hidden>■ 停止', self.html)
        self.assertIn("function stopActiveAgentTask()", self.html)
        self.assertIn("function syncActiveAgentStopControl()", self.html)
        self.assertIn("停止目前步驟並結束流程", self.html)
        self.assertIn("正在執行：${context.step?.title||'目前流程'}（可在此停止）", self.html)
        self.assertIn("'/api/agent/cancel'", self.html)
        self.assertIn("['completed','failed','cancelled'].includes(task.status)", self.html)
        self.assertIn("cancelled:'已停止'", self.html)
        self.assertIn("parsed.path == '/api/agent/cancel'", self.server)
        self.assertIn("def cancel_agent_task(task_id):", self.server)
        self.assertIn("os.killpg(process.pid, signal.SIGTERM)", self.server)

    def test_factory_can_run_every_step_sequentially_and_stop_queue(self):
        self.assertIn('id="factoryRunToggle">▶ 启动全部', self.html)
        self.assertNotIn('id="stopFactoryRun"', self.html)
        self.assertIn("running?'■ 停止全部'", self.html)
        self.assertIn("running?stopFactoryRun:startFactoryRun", self.html)
        self.assertIn("請先到「工作台設定 → Agent 連接」完成設定", self.html)
        self.assertIn("button.title=blockedReason||'啟動此工廠的全部流程'", self.html)
        self.assertIn("(!factory.steps?.length||!!activeFactoryRun())", self.html)
        self.assertIn("state.factoryRuns||={}", self.html)
        self.assertIn("function startFactoryRun()", self.html)
        self.assertIn("async function startNextFactoryStep(factoryId)", self.html)
        self.assertIn("async function handleFactoryStepFinished(key,task)", self.html)
        self.assertIn("async function stopFactoryRun()", self.html)
        self.assertIn("function resumeFactoryRunMonitor()", self.html)
        self.assertIn("run.index+=1", self.html)
        self.assertIn("if(task.status!=='completed')", self.html)
        self.assertIn("stepIds:factory.steps.map(step=>step.id)", self.html)
        self.assertIn("buildGenericPrompt(step,state.genericValues[factoryId]||{},factory)", self.html)
        self.assertIn("当前 Agent 任务和后续尚未执行的流程都会停止", self.html)
        self.assertIn("function finishFactoryRunStop(factory,run)", self.html)
        self.assertIn("if(error.status===404)", self.html)
        self.assertIn("原執行任務已不存在，已清除卡住的狀態", self.html)

    def test_api_errors_expose_http_status_for_stale_task_recovery(self):
        self.assertIn("error.status=res.status", self.html)

    def test_ai_can_generate_and_preview_multiple_flow_cards(self):
        ai_button = self.html.index('id="aiGenerateFlowBtn"')
        schedule_button = self.html.index('id="factoryScheduleBtn"')  # v1.52.0：lockFlowBtn 已移除
        self.assertLess(ai_button, schedule_button)
        self.assertIn('id="aiFlowDialog"', self.html)
        self.assertIn('id="aiFlowRequest"', self.html)
        self.assertIn('agent-chat-composer-sparkle', self.html)
        self.assertIn('id="aiFlowPreview"', self.html)
        self.assertIn('id="aiFlowChatForm"', self.html)
        self.assertIn('id="aiFlowMessages"', self.html)
        self.assertIn('id="aiFlowContextPreview"', self.html)
        self.assertIn('id="generateAiFlows" aria-label="送出">↑', self.html)
        self.assertIn('id="aiFlowContextAvatar"', self.html)
        self.assertIn('id="aiFlowFullscreen"', self.html)
        self.assertIn('id="applyAiFlows" hidden', self.html)
        self.assertIn('id="discardAiFlows"', self.html)
        self.assertIn('id="aiJsonReview" hidden', self.html)
        self.assertIn('id="aiJsonAdded"', self.html)
        self.assertIn('id="aiCodeDiff"', self.html)
        self.assertIn('確認修改並套用', self.html)
        self.assertIn("function buildAiFlowGenerationPrompt(factory,request)", self.html)
        self.assertIn("const AI_FLOW_CHAT_STORAGE_KEY='flowFactoryAiChatsV1'", self.html)
        self.assertIn("aiFlowConversations=loadAiFlowConversations()", self.html)
        self.assertIn("localStorage.setItem(AI_FLOW_CHAT_STORAGE_KEY", self.html)
        self.assertIn("Multi-agent chat isolation", self.html)
        self.assertIn("const tasks = Object.create(null)", self.html)
        self.assertIn("pollIsolated(taskId, factoryId)", self.html)
        self.assertIn("正在分析需求與現有流程", self.html)
        self.assertIn("正在整理回覆與可套用的修改方案", self.html)
        self.assertIn("function aiFlowRequestWantsChange(request)", self.html)
        self.assertIn("【系統已判定：這是流程修改要求】", self.html)
        self.assertIn("JSON.stringify(aiFlowContext", self.html)
        self.assertIn('"operation":"add|update"', self.html)
        self.assertIn('修改既有流程時必填真實流程 id', self.html)
        self.assertIn("function normalizeAiGeneratedSteps(payload,factory)", self.html)
        self.assertIn("if(source.length>12)", self.html)
        self.assertIn("function renderAiFlowPreview()", self.html)
        self.assertIn("function discardAiFlows()", self.html)
        self.assertIn("aiGeneratedSteps=[];aiFlowBeforeSignature='';aiFlowAfterFactory=null;renderAiFlowPreview();document.getElementById('aiFlowDialog').close()", self.html)
        self.assertIn("查看完整提示词", self.html)
        self.assertIn("change.operation==='update'", self.html)
        self.assertIn("await persistWorkflowConfig()", self.html)
        self.assertIn("aiFlowTaskId=result.task_id", self.html)
        self.assertIn("activeHermesTaskId||aiFlowTaskId", self.html)
        self.assertIn('function buildAiFactoryPreview(factory,changes)', self.html)
        self.assertIn('function buildJsonDiffRows(beforeText,afterText)', self.html)
        self.assertIn('function renderJsonDiff(beforeText,afterText)', self.html)
        self.assertIn("ai-diff-row.removed", self.html)
        self.assertIn("ai-diff-row.added", self.html)
        self.assertIn('aiFlowBeforeSignature=JSON.stringify(factory)', self.html)
        self.assertIn("activeHermesTaskId||activeFactoryRun()", self.html)
        # v1.52.2：送出按鈕 running 時變正方形停止圖示（可中途停止）
        self.assertIn("button.setAttribute('aria-label','停止 Agent 回覆')", self.html)
        self.assertIn('button.innerHTML=\'<span class="ai-stop-icon" aria-hidden="true"></span>\'', self.html)
        self.assertIn("button.classList.add('ai-stop-mode')", self.html)
        self.assertIn("fetchJsonResponse('/api/agent/cancel'", self.html)
        self.assertNotIn("回覆中…", self.html)
        self.assertIn("button.removeAttribute('aria-busy')", self.html)
        self.assertIn("/api/ai-flow/context", self.html)
        self.assertIn("/api/ai-flow/apply", self.html)
        self.assertIn("revision:aiFlowRevision,employee:nextFactory", self.html)
        self.assertIn("function renderAiFlowMessages()", self.html)
        self.assertIn("deduped=visible.filter", self.html)
        self.assertIn("if(window.__aiFlowTasks)return", self.html)
        self.assertIn("role:'status'", self.html)
        self.assertIn("function extractAgentJson(task)", self.html)
        self.assertIn("const isChangePayload=payload=>Array.isArray(payload)||Array.isArray(payload?.changes)||Array.isArray(payload?.steps)", self.html)
        self.assertIn("for(let index=candidates.length-1;index>=0;index--)", self.html)
        self.assertIn("沒有可解析的 JSON 修改方案", self.html)
        self.assertIn("const texts=[agentLines.join('\\n').trim(),agentLines.join('').trim()]", self.html)
        self.assertIn("<FLOW_FACTORY_JSON>", self.html)
        self.assertIn("FLOW_FACTORY_JSON>\\s*([\\s\\S]*?)\\s*<\\/FLOW_FACTORY_JSON>", self.html)

    def test_ai_chat_wraps_normal_text_but_keeps_code_scrollable(self):
        self.assertIn('id="agent-chat-horizontal-overflow"', self.html)
        self.assertIn(".agent-chat-messages{min-width:0;overflow-x:hidden}", self.html)
        self.assertIn(".agent-chat-message.agent .markdown-preview pre{max-width:100%;overflow-x:auto", self.html)
        self.assertIn(".agent-chat-message.agent .markdown-table-wrap{max-width:100%;overflow-x:hidden}", self.html)

    def test_flow_card_supports_local_script_execution_mode(self):
        self.assertIn('id="flowExecutionType"', self.html)
        self.assertIn('data-mode="script"', self.html)
        self.assertIn('AI Agent', self.html)
        self.assertIn('Script', self.html)
        self.assertIn("function buildScriptCommand(step", self.html)
        self.assertIn("/api/script/run", self.html)
        self.assertIn("setFlowExecutionMode(step?.type==='script'?'script':'prompt')", self.html)

    def test_factory_nav_reports_schedule_and_unread_completion(self):
        self.assertIn("function factoryScheduleIndicatorHtml(factoryId)", self.html)
        self.assertIn("state.scheduleSeenAt||={}", self.html)
        self.assertIn("自動執行完成，點擊查看", self.html)
        self.assertIn("switchFactory(item.dataset.wf,true)", self.html)
        self.assertIn("async function refreshFactorySchedules()", self.html)
        self.assertIn("refreshFactorySchedules()},15000)", self.html)
        self.assertIn('当前工厂在预览后已被修改，请重新提交给 AI 并确认最新差异', self.html)


if __name__ == "__main__":
    unittest.main()
