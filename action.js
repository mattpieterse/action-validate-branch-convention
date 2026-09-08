#!/usr/bin/env node


import {
    readFileSync,
    appendFileSync
} from 'fs';


// --- Script


try {
    let branch;
    const inputBranch = process.env.INPUT_BRANCH;
    if (inputBranch) {
        branch = inputBranch;
    } else {
        const githubRef = process.env.GITHUB_REF;
        const headerRef = process.env.GITHUB_HEAD_REF;

        branch = headerRef || (githubRef || '').replace(/^refs\/heads\//, '');
    }

    const githubRef = process.env.GITHUB_REF;

    if ((branch || githubRef).startsWith('refs/tags/')) {
        console.log(`ℹ️ Skipping branch validation for tag refs: ${githubRef || branch}`);
        process.exit(0);
    }

    console.log(`🔍 Validating branch: ${branch}`);

    const regex = /^(main|staging|topic\/[a-z0-9-]+|debug\/[a-z0-9-]+|tests\/[a-z0-9-]+|rollback\/[a-z0-9-]+)$/;

    if (regex.test(branch)) {
        console.log('✅ Follows accepted conventions.');
        
        if (inputBranch) {
            console.log('⚠️ Testing input-variables were used and override the real-world values.');
            const summary = readFileSync(new URL('./action-summary-on-tests.md', import.meta.url), 'utf8');
            appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
        }

        process.exit(0);
    } else {
        console.log(`❌ Invalid branch name.`);
        console.log('See summary for details.');

        let summary = readFileSync(new URL('./action-summary-on-error.md', import.meta.url), 'utf8')
            .replace('{{BRANCH_NAME}}', branch);

        if (inputBranch) {
            console.log('⚠️ Testing input-variables were used and override the real-world values.');
            const testWarning = readFileSync(new URL('./action-summary-on-tests.md', import.meta.url), 'utf8');
            summary = summary.replace('{{TEST_WARNING}}', testWarning);
        } else {
            summary = summary.replace('{{TEST_WARNING}}\n\n', '');
        }

        appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
        process.exit(1);
    }
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
