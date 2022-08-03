<?php

namespace VoicesOfWynn\Models\Api\LineReporting;

use PDOException;
use VoicesOfWynn\Models\Db;

class ReportAdder
{

    const ANONYMOUS_REPORT_NAME_INDICATOR = "anonymous";

    /**
     * Processing method for a request creating a new report
     * @param string $chatMessage Exact copy of the chat message, that should trigger the dialogue
     * @param string $npcName Name of the NPC extracted from the chat message by the mod client
     * @param string $playerName Name of the player sending this report; in case of an anonymous report, the value
     * should be set to the value of ANONYMOUS_REPORT_NAME_INDICATOR value
     * @param int $posX The X coordinate of the player at the time of receiving the chat message
     * @param int $posY The Y coordinate of the player at the time of receiving the chat message
     * @param int $posZ The Z coordinate of the player at the time of receiving the chat message
     * @return bool
     */
    public function createReport(string $chatMessage, string $npcName, string $playerName, int $posX, int $posY, int $posZ) {
        if (!(
            $this->checkLength($chatMessage, 1, 511) &&
            $this->checkLength($npcName, 0, 127) &&
            $this->checkLength($playerName, 1, 16) &&
            $this->checkRange($posX, -8388608, 8388607) &&
            $this->checkRange($posY, -8388608, 8388607) &&
            $this->checkRange($posZ, -8388608, 8388607)
        )) {
            return 406;
        }

        if ($playerName === self::ANONYMOUS_REPORT_NAME_INDICATOR) {
            $playerName = hash('sha256', $_SERVER['REMOTE_ADDR']);
        }

        $db = new Db('Api/LineReporting/DbInfo.ini');

        try {
            //Check whether this line has already been reported
            $result = $db->fetchQuery('SELECT report_id FROM report WHERE chat_message = ? LIMIT 1', array($chatMessage));
            if ($result === false) {
                //Completely new report
                $result = $db->executeQuery('INSERT INTO report (chat_message, npc_name, player, pos_x, pos_y, pos_z) VALUES (?,?,?,?,?,?)',
                    array(
                        $chatMessage,
                        $npcName,
                        $playerName,
                        $posX,
                        $posY,
                        $posZ,
                    ));

                return ($result) ? 201 : 500;
            }
            else {
                //Updating existing report
                $existingReportId = $result['report_id'];
                $result = $db->executeQuery('UPDATE report SET 
                  pos_x = (pos_x * reported_times + ?) / (reported_times + 1), 
                  pos_y = (pos_y * reported_times + ?) / (reported_times + 1), 
                  pos_z = (pos_z * reported_times + ?) / (reported_times + 1), 
                  reported_times = reported_times + 1 WHERE report_id = ?;',
                    array(
                        $_POST['x'],
                        $_POST['y'],
                        $_POST['z'],
                        $existingReportId,
                    ));

                return ($result) ? 204 : 500;
            }
        } catch (PDOException $e) {
            return 500;
        }
    }

    /**
     * Method checking a length of an input string
     * If the length requirement is not fullfilled, the script execution is terminated and the 406 Not Acceptable HTTP status is sent back
     * @param string $str String to check
     * @param int $min Minimal length
     * @param int $max Maximal length
     */
    private function checkLength(string $str, int $min, int $max): bool
    {
        if (strlen($str) < $min || strlen($str) > $max) {
            return false;
        }
        return true;
    }

    /**
     * Method checking a size of an input integer
     * If the range requirement is not fulfilled, the script execution is terminated and the 406 Not Acceptable HTTP status is sent back
     * @param int $num Integer to check
     * @param int $min Minimal length
     * @param int $max Maximal length
     */
    private function checkRange(int $num, int $min, int $max): bool
    {
        if ($num < $min || $num > $max) {
            return false;
        }
        return true;
    }
}
