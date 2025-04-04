import json
from ansible.plugins.callback import CallbackBase
import requests

class CallbackModule(CallbackBase):
    CALLBACK_VERSION = 2.0
    CALLBACK_TYPE = 'stdout'
    CALLBACK_NAME = 'progress_tracker'

    def __init__(self):
        super(CallbackModule, self).__init__()
        self.task_total = 0
        self.task_current = 0
        self._display.banner("🔧 Progress Tracker Initialized")

    def v2_playbook_on_start(self, playbook):
            self.task_total = 0
            self.task_current = 0
            self._display.banner(f"🚀 Playbook started")

    def v2_playbook_on_play_start(self, play):
            tasks = [];
            
            host_info_list = self.get_host_info_from_play(play)
            
            for block in play.compile():
                for task in block.block:
                    if task.get_name() and 'meta' not in task.get_name().lower():
                        tasks.append(task.get_name())
            
            self.task_total = len(tasks)
            self._display.display(f"📋 Play '{play.get_name()}' has {len(tasks)} tasks. {host_info_list}")
            progress = 0
            payload = {
                'tasks': tasks,
                "totalTask": self.task_total,
                'play_name': play.get_name(),
                'hosts': host_info_list,
                "progress": progress,
                "status": "UPGRADING",
            }
            self.post_progress(payload)

    def v2_playbook_on_task_start(self, task, is_conditional):
        play = task.get_play()
        self.task_current += 1 # TODO 
        host_info_list = self.get_host_info_from_play(play)
        self._display.display(f"⚙️  Starting Task {self.task_current}/{self.task_total or '?'}: {task.get_name()} for hosts {host_info_list}")
        payload = {
            "totalTask": self.task_total,
            'play_name': play.get_name(),
            'hosts': host_info_list,
            "progress": 0,
        }
        self.post_progress(payload)

    def v2_runner_on_failed(self, result, ignore_errors=False):
        self._display.display(f"❌ Failed: {result.task_name or result._task.name} Host: {result._host.get_name()}")
        self.task_current += 1
        host_info = {
            "name": result._host.get_name(),
            "ip": result._host.get_vars().get('ansible_host', 'N/A')
        }
        payload = {
            "totalTask": self.task_total,
            'hosts': [host_info],
            'status': 'FAILED',
        }
        self.post_progress(payload)

    def v2_runner_on_unreachable(self, result):
        self._display.display(f"❌ Unreachable:  Host: {result._host.get_name()} Task: {result.task_name}")
        host_info = {
            "name": result._host.get_name(),
            "ip": result._host.get_vars().get('ansible_host', 'N/A')
        }
        payload = {
            "totalTask": self.task_total,
            'hosts': [host_info],
            'status': 'FAILED',
        }
        self.post_progress(payload)

    def v2_runner_on_ok(self, result):
        self._display.display(f"✅ Completed:  Host: {result._host.get_name()} Task: {result._task.name}")
        host_info = {
            "name": result._host.get_name(),
            "ip": result._host.get_vars().get('ansible_host', 'N/A')
        }
        progress = 50 # TODO: Calculate progress based on tasks 
        payload = {
            'totalTasks': self.task_total,
            'hosts': [host_info],
            'progress': progress,
            'status': 'UPGRADING',
        }
        self.post_progress(payload)

    def v2_runner_on_skipped(self, result):
        self._display.display(f"⏭️  Skipped:  Host: {result._host.get_name()} Task: {result._task.name} Host IP: {result._host.get_vars().get('ansible_host', 'N/A')}")
        host_info = {
            "name": result._host.get_name(),
            "ip": result._host.get_vars().get('ansible_host', 'N/A')
        }
        progress = 50 # TODO: Calculate progress based on tasks 
        payload = {
            "totalTask": self.task_total,
            'hosts': [host_info],
            'progress': progress,
            'status': 'UPGRADING',
        }
        self.post_progress(payload)


    def v2_playbook_on_stats(self, stats):
        self._display.display(f"✅ Playbook completed 🧮 Final Task Progress: {self.task_current}/{self.task_total or '?'}")
      

    def get_host_info_from_play(self, play):
        inventory = play.get_variable_manager()._inventory
        host_list = inventory.get_hosts(play.hosts)

        host_info_list = []

        for host in host_list:
            host_vars = play.get_variable_manager().get_vars(host=host)
            ip = host_vars.get("ansible_host", host.name)

            host_info_list.append({
                    "name": host.name,
                    "ip": ip
                })
            
        return host_info_list
    
    def post_progress(self, payload):
        try:
            url = "http://localhost:3000/webhook/clusters/cluster-id/update-status"
            headers = {
            'Content-Type': 'application/json'
            }
            
            payload["type"] = "UPGRADE"
            payload["clusterType"] = "ELASTIC"

            data = json.dumps(payload)
            response = requests.request("POST", url, headers=headers, data=data)
            if response.status_code != 200:
                print(f"Failed to post progress: {response.status_code} - {response.text}")
        except Exception as e:
            self._display.display(f"error posting progress: {str(e)}")

