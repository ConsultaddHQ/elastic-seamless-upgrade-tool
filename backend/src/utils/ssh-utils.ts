import path from "path";
import fs from "fs";

const ANSIBLE_PLAYBOOKS_PATH = process.env.ANSIBLE_PLAYBOOKS_PATH || "";
const sshKeysDir = path.join(ANSIBLE_PLAYBOOKS_PATH, "ssh-keys");
if (!fs.existsSync(sshKeysDir)) {
	fs.mkdirSync(sshKeysDir, { recursive: true });
}

export const createSSHPrivateKeyFile = (privateKey: string, fileName: string = "SSH_key.pem"): string => {
	if (typeof privateKey !== "string" || !privateKey.trim()) {
		throw new Error("Invalid SSH key: Key must be a non-empty string.");
	}

	const keyPath = path.join(sshKeysDir, fileName);
	fs.writeFileSync(keyPath, privateKey);
	fs.chmodSync(keyPath, 0o600);
	return keyPath;
};

export const sshFilefileExists = (filePath: string): boolean => {
	try {
		const keyPath = path.join(sshKeysDir, filePath);
		fs.accessSync(path.resolve(keyPath));
		return true;
	} catch {
		return false;
	}
};
